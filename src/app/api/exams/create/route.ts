import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

const MIN_QUESTIONS = 20;

const ALLOWED_DURATIONS = new Set([
  2700, // 45 minutes
  3600, // 1 hour
  4500, // 1 hour 15 minutes
  5400, // 1 hour 30 minutes
  6300, // 1 hour 45 minutes
  7200, // 2 hours
]);

const ALLOWED_QUESTION_COUNTS = new Set([
  20,
  25,
  30,
  35,
  40,
]);

const ALLOWED_EXAM_TYPES = new Set([
  "BECE",
  "LIKELY",
  "TOPIC_BASED",
]);

const classLabels: Record<string, string> = {
  PRIMARY_1: "Primary 1",
  PRIMARY_2: "Primary 2",
  PRIMARY_3: "Primary 3",
  PRIMARY_4: "Primary 4",
  PRIMARY_5: "Primary 5",
  PRIMARY_6: "Primary 6",
  JHS_1: "JHS 1",
  JHS_2: "JHS 2",
  JHS_3: "JHS 3",
};

const examTypeLabels: Record<string, string> = {
  BECE: "BECE",
  LIKELY: "Likely Examination Questions",
  TOPIC_BASED: "Topic-Based Examination",
};

function shuffle<T>(items: T[]): T[] {
  const result = [...items];

  for (let index = result.length - 1; index > 0; index--) {
    const randomIndex = Math.floor(
      Math.random() * (index + 1)
    );

    [result[index], result[randomIndex]] = [
      result[randomIndex],
      result[index],
    ];
  }

  return result;
}

export async function POST(request: Request) {
  try {
    // ---------------------------------------------------------
    // Authentication
    // ---------------------------------------------------------

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

    // ---------------------------------------------------------
    // Read request body
    // ---------------------------------------------------------

    const body = await request.json();

    const subjectId =
      typeof body.subjectId === "string"
        ? body.subjectId.trim()
        : "";

    const creationKey =
      typeof body.creationKey === "string"
        ? body.creationKey.trim()
        : "";

    const examType =
      typeof body.examType === "string"
        ? body.examType.trim().toUpperCase()
        : "";

    const topicId =
      typeof body.topicId === "string"
        ? body.topicId.trim()
        : "";

    const beceYear =
      body.beceYear === undefined ||
      body.beceYear === null ||
      body.beceYear === ""
        ? null
        : Number(body.beceYear);

    const duration =
      body.duration === undefined ||
      body.duration === null ||
      body.duration === ""
        ? null
        : Number(body.duration);

    const questionCount =
      body.questionCount === undefined ||
      body.questionCount === null ||
      body.questionCount === ""
        ? null
        : Number(body.questionCount);

    // ---------------------------------------------------------
    // Basic validation
    // ---------------------------------------------------------

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

    if (
      !examType ||
      !ALLOWED_EXAM_TYPES.has(examType)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid examination type.",
        },
        { status: 400 }
      );
    }

    if (
      duration === null ||
      !Number.isInteger(duration) ||
      !ALLOWED_DURATIONS.has(duration)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid examination duration.",
        },
        { status: 400 }
      );
    }

    if (
      questionCount === null ||
      !Number.isInteger(questionCount) ||
      !ALLOWED_QUESTION_COUNTS.has(questionCount)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid number of questions.",
        },
        { status: 400 }
      );
    }

    if (
      examType === "BECE" &&
      questionCount !== 40
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "BECE examinations must contain exactly 40 questions.",
        },
        { status: 400 }
      );
    }

    // ---------------------------------------------------------
    // Conditional validation
    // ---------------------------------------------------------

    if (examType === "TOPIC_BASED" && !topicId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "A topic is required for a topic-based examination.",
        },
        { status: 400 }
      );
    }

    if (examType !== "TOPIC_BASED" && topicId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "A topic can only be selected for a topic-based examination.",
        },
        { status: 400 }
      );
    }

    if (examType === "BECE") {
      if (
        beceYear === null ||
        !Number.isInteger(beceYear) ||
        beceYear < 2000 ||
        beceYear > new Date().getFullYear()
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "A valid BECE year is required.",
          },
          { status: 400 }
        );
      }
    } else if (beceYear !== null) {
      return NextResponse.json(
        {
          success: false,
          message:
            "BECE year can only be selected for a BECE examination.",
        },
        { status: 400 }
      );
    }

    // ---------------------------------------------------------
    // Verify subject
    // ---------------------------------------------------------

    const subject = await prisma.subject.findUnique({
      where: {
        id: subjectId,
      },
      select: {
        id: true,
        name: true,
        isActive: true,
      },
    });

    if (!subject || !subject.isActive) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Subject not found or inactive.",
        },
        { status: 404 }
      );
    }

    // ---------------------------------------------------------
    // Verify student profile
    // ---------------------------------------------------------

    const profile = await prisma.profile.findUnique({
      where: {
        userId,
      },
      select: {
        classLevel: true,
      },
    });

    if (!profile?.classLevel) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Your class has not been set. Please update your profile.",
        },
        { status: 400 }
      );
    }

    const studentClass = profile.classLevel;
    const classLabel =
      classLabels[studentClass] ?? studentClass;

    // ---------------------------------------------------------
    // JHS restriction for BECE
    // ---------------------------------------------------------

    if (
      examType === "BECE" &&
      !studentClass.startsWith("JHS_")
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "BECE examinations are available to JHS students.",
        },
        { status: 403 }
      );
    }

    // ---------------------------------------------------------
    // Verify topic when Topic-Based
    // ---------------------------------------------------------

    let selectedTopic: {
      id: string;
      name: string;
      subjectId: string;
    } | null = null;

    if (examType === "TOPIC_BASED") {
      selectedTopic = await prisma.topic.findFirst({
        where: {
          id: topicId,
          subjectId,
        },
        select: {
          id: true,
          name: true,
          subjectId: true,
        },
      });

      if (!selectedTopic) {
        return NextResponse.json(
          {
            success: false,
            message:
              "The selected topic is not available for this subject.",
          },
          { status: 400 }
        );
      }
    }

    // ---------------------------------------------------------
    // Verify BECE year exists
    // ---------------------------------------------------------

    if (
      examType === "BECE" &&
      beceYear !== null
    ) {
      const beceQuestionExists =
        await prisma.question.findFirst({
          where: {
            subjectId,
            classLevel: {
              in: [
                "JHS_1",
                "JHS_2",
                "JHS_3",
              ],
            },
            examType: "BECE",
            beceYear,
            status: "PUBLISHED",
          },
          select: {
            id: true,
          },
        });

      if (!beceQuestionExists) {
        return NextResponse.json(
          {
            success: false,
            message:
              `No published BECE ${beceYear} questions are currently available for ${subject.name}.`,
          },
          { status: 400 }
        );
      }
    }

    // ---------------------------------------------------------
    // Idempotency check
    // ---------------------------------------------------------

    const existingByCreationKey =
      await prisma.exam.findUnique({
        where: {
          examCreationKey: creationKey,
        },
      });

    if (existingByCreationKey) {
      if (
        existingByCreationKey.userId !== userId ||
        existingByCreationKey.subjectId !== subjectId
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Invalid exam creation request.",
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
            startedAt:
              existingByCreationKey.startedAt,
            expiresAt:
              existingByCreationKey.expiresAt,
          },
          existing: true,
        },
        { status: 200 }
      );
    }

    // ---------------------------------------------------------
    // Create examination transaction
    // ---------------------------------------------------------

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

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        result = await prisma.$transaction(
          async (tx) => {
            // -------------------------------------------------
            // Advisory lock
            // -------------------------------------------------

            const lockKey =
              `${userId}:${subjectId}`;

            await tx.$queryRaw`
              SELECT 'locked'::text AS lock_status
              FROM (
                SELECT pg_advisory_xact_lock(
                  hashtextextended(${lockKey}, 0)
                )
              ) AS lock_result
            `;

            // -------------------------------------------------
            // Existing active exam
            // -------------------------------------------------

            const activeExam =
              await tx.exam.findFirst({
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
                  startedAt:
                    activeExam.startedAt,
                  expiresAt:
                    activeExam.expiresAt,
                },
                created: false,
              };
            }

            const now = new Date();

            // -------------------------------------------------
            // Find active subscription
            // -------------------------------------------------

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

            // -------------------------------------------------
            // Expired paid subscription
            // -------------------------------------------------

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
              throw new Error(
                "SUBSCRIPTION_EXPIRED"
              );
            }

            // -------------------------------------------------
            // Free-plan limit
            // -------------------------------------------------

            if (
              subscription.plan.type === "FREE"
            ) {
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

                throw new Error(
                  "TEST_LIMIT_REACHED"
                );
              }
            }

            // -------------------------------------------------
            // Re-check subject
            // -------------------------------------------------

            const transactionSubject =
              await tx.subject.findUnique({
                where: {
                  id: subjectId,
                },
                select: {
                  id: true,
                  name: true,
                  isActive: true,
                },
              });

            if (
              !transactionSubject ||
              !transactionSubject.isActive
            ) {
              throw new Error(
                "SUBJECT_NOT_FOUND"
              );
            }

            // -------------------------------------------------
            // Build secure question filter
            // -------------------------------------------------

            const questionWhere: Prisma.QuestionWhereInput =
              {
                subjectId,
                status: "PUBLISHED",
                classLevel:
                  examType === "BECE"
                    ? "JHS_3"
                    : studentClass,
                examType:
                  examType as
                    | "BECE"
                    | "LIKELY"
                    | "TOPIC_BASED",
              };

            if (
              examType === "TOPIC_BASED" &&
              selectedTopic
            ) {
              questionWhere.topicId =
                selectedTopic.id;
            }

            if (
              examType === "BECE" &&
              beceYear !== null
            ) {
              questionWhere.beceYear = beceYear;
            }

            // -------------------------------------------------
            // Retrieve matching published questions
            // -------------------------------------------------

            const publishedQuestions =
              await tx.question.findMany({
                where: questionWhere,
                select: {
                  id: true,
                  marks: true,
                },
              });

            // -------------------------------------------------
            // Minimum question requirement
            // -------------------------------------------------

            if (
              publishedQuestions.length <
              questionCount
            ) {
              throw new Error(
                "NOT_ENOUGH_QUESTIONS"
              );
            }

            // -------------------------------------------------
            // Random selection
            // -------------------------------------------------

            const shuffledQuestions =
              shuffle(publishedQuestions);

            const selectedQuestions =
              shuffledQuestions.slice(
                0,
                questionCount
              );

            // -------------------------------------------------
            // Duration
            // -------------------------------------------------

            const durationMinutes =
              duration / 60;

            const startedAt = new Date();

            const expiresAt = new Date(
              startedAt.getTime() +
                duration * 1000
            );

            // -------------------------------------------------
            // Build title
            // ---------------------------------------------------------

            let title =
              `${transactionSubject.name} `;

            if (examType === "BECE") {
              title += `BECE ${beceYear}`;
            } else if (
              examType === "TOPIC_BASED" &&
              selectedTopic
            ) {
              title += selectedTopic.name;
            } else {
              title +=
                examTypeLabels.LIKELY;
            }

            title += ` — ${classLabel}`;

            // -------------------------------------------------
            // Create exam
            // ---------------------------------------------------------

            const exam = await tx.exam.create({
              data: {
                examCreationKey:
                  creationKey,
                userId,
                subjectId,
                title,
                durationMinutes,
                totalQuestions:
                  selectedQuestions.length,
                status: "IN_PROGRESS",
                startedAt,
                expiresAt,
                questions: {
                  create:
                    selectedQuestions.map(
                      (question, index) => ({
                        questionId:
                          question.id,
                        questionNo:
                          index + 1,
                        marks:
                          question.marks,
                      })
                    ),
                },
              },
            });

            // -------------------------------------------------
            // Count test against subscription
            // ---------------------------------------------------------

            await tx.subscription.update({
              where: {
                id: subscription.id,
              },
              data: {
                testsUsed: {
                  increment: 1,
                },
                ...(subscription.plan.type ===
                "FREE"
                  ? {
                      freeTestsUsed: {
                        increment: 1,
                      },
                    }
                  : {}),
              },
            });

            // -------------------------------------------------
            // Expire Free plan after final test
            // ---------------------------------------------------------

            if (
              subscription.plan.type ===
              "FREE"
            ) {
              const freeLimit =
                subscription.plan.testsAllowed ?? 0;

              const newFreeTestsUsed =
                subscription.freeTestsUsed + 1;

              if (
                newFreeTestsUsed >=
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
                startedAt:
                  exam.startedAt,
                expiresAt:
                  exam.expiresAt,
              },
              created: true,
            };
          },
          {
            isolationLevel: "Serializable",
          }
        );

        break;
      } catch (error) {
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

        await new Promise((resolve) =>
          setTimeout(
            resolve,
            100 * attempt
          )
        );
      }
    }

    // ---------------------------------------------------------
    // Safety check
    // ---------------------------------------------------------

    if (!result) {
      throw new Error(
        "EXAM_CREATION_FAILED"
      );
    }

    // ---------------------------------------------------------
    // Existing active exam
    // ---------------------------------------------------------

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

    // ---------------------------------------------------------
    // Success
    // ---------------------------------------------------------

    return NextResponse.json(
      {
        success: true,
        message:
          "Exam created successfully.",
        exam: result.exam,
        existing: false,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Exam creation error:",
      error
    );

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
                "There are not enough published questions matching your selected examination settings.",
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