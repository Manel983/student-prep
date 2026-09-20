import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized.",
        },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    const body = await request.json();

    const subjectId =
      typeof body.subjectId === "string"
        ? body.subjectId.trim()
        : "";

    const creationKey =
      typeof body.creationKey === "string"
        ? body.creationKey.trim()
        : "";

    if (!subjectId) {
      return NextResponse.json(
        {
          success: false,
          message: "Subject is required.",
        },
        { status: 400 }
      );
    }

    if (!creationKey) {
      return NextResponse.json(
        {
          success: false,
          message: "Creation key is required.",
        },
        { status: 400 }
      );
    }

    /*
     * Verify that the subject exists.
     */
    const subject = await prisma.subject.findUnique({
      where: {
        id: subjectId,
      },
    });

    if (!subject || !subject.isActive) {
      return NextResponse.json(
        {
          success: false,
          message: "Subject not found or inactive.",
        },
        { status: 404 }
      );
    }

    /*
     * Idempotency check.
     *
     * If the same creation key is submitted again, return the
     * already-created exam instead of creating another one.
     */
    const existingByCreationKey =
      await prisma.exam.findUnique({
        where: {
          creationKey,
        },
      });

    if (existingByCreationKey) {
      /*
       * Never allow a creation key belonging to another user or
       * another subject to be reused.
       */
      if (
        existingByCreationKey.userId !== userId ||
        existingByCreationKey.subjectId !== subjectId
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid exam creation request.",
          },
          { status: 403 }
        );
      }

      return NextResponse.json(
        {
          success: true,
          message:
            "This exam has already been created. Resuming it.",
          exam: {
            id: existingByCreationKey.id,
            title: existingByCreationKey.title,
            durationMinutes:
              existingByCreationKey.durationMinutes,
            totalQuestions:
              existingByCreationKey.totalQuestions,
            startedAt: existingByCreationKey.startedAt,
            expiresAt: existingByCreationKey.expiresAt,
          },
          existing: true,
        },
        { status: 200 }
      );
    }

    /*
     * Result of the transaction.
     */
    let result:
      | {
          exam: {
            id: string;
            title: string;
            durationMinutes: number;
            totalQuestions: number;
            startedAt: Date | null;
            expiresAt: Date | null;
          };
          created: boolean;
        }
      | undefined;

    /*
     * Retry transient Prisma P2034 write conflicts.
     *
     * This can happen when two requests attempt to create an exam
     * for the same user and subject simultaneously.
     */
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        result = await prisma.$transaction(
          async (tx) => {
            /*
             * Advisory lock.
             *
             * The lock is based on the authenticated user and
             * selected subject.
             *
             * Build the lock key first so that the SQL template
             * remains simple and safe.
             */
            const lockKey = `${userId}:${subjectId}`;

            await tx.$queryRaw`
              SELECT 'locked'::text AS lock_status
              FROM (
                SELECT pg_advisory_xact_lock(
                  hashtextextended(${lockKey}, 0)
                )
              ) AS lock_result
            `;
            /*
             * Check for an existing active exam.
             *
             * This check is inside the transaction and protected
             * by the advisory lock.
             */
            const activeExam = await tx.exam.findFirst({
              where: {
                userId,
                subjectId,
                status: "IN_PROGRESS",
                expiresAt: {
                  gt: new Date(),
                },
              },
              orderBy: {
                createdAt: "desc",
              },
            });

            if (activeExam) {
              return {
                exam: {
                  id: activeExam.id,
                  title: activeExam.title,
                  durationMinutes:
                    activeExam.durationMinutes,
                  totalQuestions:
                    activeExam.totalQuestions,
                  startedAt: activeExam.startedAt,
                  expiresAt: activeExam.expiresAt,
                },
                created: false,
              };
            }

            const now = new Date();

            /*
             * Find an active subscription.
             *
             * Paid subscriptions are valid only when their
             * expiry date is still in the future.
             *
             * The Free plan has no expiry date.
             */
            let subscription =
              await tx.subscription.findFirst({
                where: {
                  userId,
                  status: "ACTIVE",
                  OR: [
                    {
                      paymentRequired: false,
                      plan: {
                        type: "FREE",
                      },
                    },
                    {
                      paymentRequired: true,
                      plan: {
                        type: {
                          in: [
                            "MONTHLY",
                            "SIX_MONTHS",
                            "YEARLY",
                          ],
                        },
                      },
                      expiresAt: {
                        gt: now,
                      },
                    },
                  ],
                },
                include: {
                  plan: true,
                },
                orderBy: {
                  createdAt: "desc",
                },
              });

            /*
             * Check whether the user has an expired paid plan.
             */
            const expiredPaidSubscription =
              await tx.subscription.findFirst({
                where: {
                  userId,
                  status: "ACTIVE",
                  paymentRequired: true,
                  expiresAt: {
                    lte: now,
                  },
                  plan: {
                    type: {
                      in: [
                        "MONTHLY",
                        "SIX_MONTHS",
                        "YEARLY",
                      ],
                    },
                  },
                },
                include: {
                  plan: true,
                },
                orderBy: {
                  expiresAt: "desc",
                },
              });

            /*
             * Expire the paid subscription and fall back to Free.
             */
            if (expiredPaidSubscription) {
              await tx.subscription.update({
                where: {
                  id: expiredPaidSubscription.id,
                },
                data: {
                  status: "EXPIRED",
                },
              });

              subscription =
                await tx.subscription.findFirst({
                  where: {
                    userId,
                    status: "ACTIVE",
                    paymentRequired: false,
                    plan: {
                      type: "FREE",
                    },
                  },
                  include: {
                    plan: true,
                  },
                  orderBy: {
                    createdAt: "desc",
                  },
                });
            }

            if (!subscription) {
              throw new Error("SUBSCRIPTION_EXPIRED");
            }

            /*
             * Enforce Free-plan test limit.
             */
            if (subscription.plan.type === "FREE") {
              const freeLimit =
                subscription.plan.testsAllowed ?? 0;

              if (
                subscription.freeTestsUsed >=
                freeLimit
              ) {
                await tx.subscription.update({
                  where: {
                    id: subscription.id,
                  },
                  data: {
                    status: "EXPIRED",
                  },
                });

                throw new Error("TEST_LIMIT_REACHED");
              }
            }

            /*
             * Re-check the subject inside the transaction.
             */
            const transactionSubject =
              await tx.subject.findUnique({
                where: {
                  id: subjectId,
                },
              });

            if (
              !transactionSubject ||
              !transactionSubject.isActive
            ) {
              throw new Error("SUBJECT_NOT_FOUND");
            }

            /*
             * Get published questions only.
             */
            const publishedQuestions =
              await tx.question.findMany({
                where: {
                  subjectId,
                  status: "PUBLISHED",
                },
                select: {
                  id: true,
                  marks: true,
                },
              });

            /*
             * A valid test requires at least 20 questions.
             */
            if (publishedQuestions.length < 20) {
              throw new Error("NOT_ENOUGH_QUESTIONS");
            }

            /*
             * Randomize the available questions.
             */
            const shuffledQuestions = [
              ...publishedQuestions,
            ].sort(() => Math.random() - 0.5);

            const selectedQuestions =
              shuffledQuestions.slice(0, 20);

            const durationMinutes = 30;

            const startedAt = new Date();

            const expiresAt = new Date(
              startedAt.getTime() +
                durationMinutes * 60 * 1000
            );

            /*
             * Create the exam.
             *
             * Correct answers are deliberately NOT selected here.
             * The active exam API should only expose the question
             * and option data.
             */
            const exam = await tx.exam.create({
              data: {
                creationKey,
                userId,
                subjectId,
                title: `${transactionSubject.name} Practice Test`,
                durationMinutes,
                totalQuestions:
                  selectedQuestions.length,
                status: "IN_PROGRESS",
                startedAt,
                expiresAt,
                questions: {
                  create: selectedQuestions.map(
                    (question, index) => ({
                      questionId: question.id,
                      questionNo: index + 1,
                      marks: question.marks,
                    })
                  ),
                },
              },
            });

            /*
             * Count the test against the subscription.
             */
            await tx.subscription.update({
              where: {
                id: subscription.id,
              },
              data: {
                testsUsed: {
                  increment: 1,
                },
                ...(subscription.plan.type === "FREE"
                  ? {
                      freeTestsUsed: {
                        increment: 1,
                      },
                    }
                  : {}),
              },
            });

            /*
             * When the Free plan reaches 5 tests, mark it expired.
             */
            if (subscription.plan.type === "FREE") {
              const freeLimit =
                subscription.plan.testsAllowed ?? 0;

              const newFreeTestsUsed =
                subscription.freeTestsUsed + 1;

              if (
                newFreeTestsUsed >= freeLimit
              ) {
                await tx.subscription.update({
                  where: {
                    id: subscription.id,
                  },
                  data: {
                    status: "EXPIRED",
                  },
                });
              }
            }

            return {
              exam: {
                id: exam.id,
                title: exam.title,
                durationMinutes:
                  exam.durationMinutes,
                totalQuestions:
                  exam.totalQuestions,
                startedAt: exam.startedAt,
                expiresAt: exam.expiresAt,
              },
              created: true,
            };
          },
          {
            isolationLevel: "Serializable",
          }
        );

        /*
         * Transaction completed successfully.
         */
        break;
      } catch (error) {
        /*
         * Only retry Prisma P2034.
         */
        if (
          !(
            error instanceof
              Prisma.PrismaClientKnownRequestError &&
            error.code === "P2034"
          ) ||
          attempt === 3
        ) {
          throw error;
        }

        console.warn(
          `Exam creation transaction conflict. ` +
            `Retrying attempt ${attempt + 1}/3...`
        );

        /*
         * Small backoff before retrying.
         */
        await new Promise((resolve) =>
          setTimeout(resolve, 100 * attempt)
        );
      }
    }

    /*
     * Safety check.
     */
    if (!result) {
      throw new Error("EXAM_CREATION_FAILED");
    }

    /*
     * Another request created the active exam first.
     */
    if (!result.created) {
      return NextResponse.json(
        {
          success: true,
          message:
            "You already have an active test for this subject. Resuming it.",
          exam: result.exam,
          existing: true,
        },
        { status: 200 }
      );
    }

    /*
     * New exam created successfully.
     */
    return NextResponse.json(
      {
        success: true,
        message: "Exam created successfully.",
        exam: result.exam,
        existing: false,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Exam creation error:", error);

    if (error instanceof Error) {
      switch (error.message) {
        case "SUBSCRIPTION_EXPIRED":
          return NextResponse.json(
            {
              success: false,
              message:
                "Your subscription has expired. Please subscribe to continue.",
            },
            { status: 403 }
          );

        case "TEST_LIMIT_REACHED":
          return NextResponse.json(
            {
              success: false,
              message:
                "You have reached the maximum number of tests allowed on the Free plan.",
            },
            { status: 403 }
          );

        case "SUBJECT_NOT_FOUND":
          return NextResponse.json(
            {
              success: false,
              message:
                "The selected subject is not available.",
            },
            { status: 404 }
          );

        case "NOT_ENOUGH_QUESTIONS":
          return NextResponse.json(
            {
              success: false,
              message:
                "There are not enough published questions for this subject to create a test.",
            },
            { status: 400 }
          );

        case "EXAM_CREATION_FAILED":
          return NextResponse.json(
            {
              success: false,
              message:
                "The exam could not be created. Please try again.",
            },
            { status: 500 }
          );
      }
    }

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to create the exam. Please try again.",
      },
      { status: 500 }
    );
  }
}