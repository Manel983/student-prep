import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const submitExamSchema = z.object({
  examId: z.string().min(1, "Exam ID is required."),
  answers: z.record(z.string(), z.string()).default({}),
  autoSubmit: z.boolean().default(false),
});

const VALID_ANSWERS = new Set(["A", "B", "C", "D"]);

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: "You must be logged in to submit this test.",
        },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    const body = await request.json();

    const validation = submitExamSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid submission data.",
        },
        { status: 400 }
      );
    }

    const {
      examId,
      answers,
      autoSubmit,
    } = validation.data;

    const exam = await prisma.exam.findFirst({
      where: {
        id: examId,
        userId,
      },

      include: {
        questions: {
          orderBy: {
            questionNo: "asc",
          },

          include: {
            question: {
              select: {
                id: true,
                correctAnswer: true,
                explanation: true,
              },
            },
          },
        },

        subject: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!exam) {
      return NextResponse.json(
        {
          success: false,
          message: "Exam not found.",
        },
        { status: 404 }
      );
    }

    /*
     * Prevent submitting an exam that has already been completed.
     */
    if (
      exam.status === "SUBMITTED" ||
      exam.status === "AUTO_SUBMITTED" ||
      exam.status === "MARKED"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "This test has already been submitted.",
        },
        { status: 409 }
      );
    }

    /*
     * Verify that every submitted question belongs
     * to this particular exam.
     */
    const examQuestionIds = new Set(
      exam.questions.map(
        (examQuestion) =>
          examQuestion.question.id
      )
    );

    for (const questionId of Object.keys(answers)) {
      if (!examQuestionIds.has(questionId)) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Invalid question detected in the submission.",
          },
          { status: 400 }
        );
      }

      const answer = answers[questionId]?.toUpperCase();

      if (!VALID_ANSWERS.has(answer)) {
        return NextResponse.json(
          {
            success: false,
            message:
              "One or more submitted answers are invalid.",
          },
          { status: 400 }
        );
      }
    }

    const now = new Date();

    /*
     * The server decides whether the exam has expired.
     */
    const examExpired =
      exam.expiresAt !== null &&
      exam.expiresAt <= now;

    const finalAutoSubmit =
      autoSubmit || examExpired;

    let score = 0;
    let totalMarks = 0;
    let correctAnswers = 0;
    let wrongAnswers = 0;
    let unanswered = 0;

    const answerRecords: {
      questionId: string;
      answer: string | null;
      isCorrect: boolean | null;
      marksAwarded: number;
      answeredAt: Date | null;
    }[] = [];

    const mistakeRecords: {
      questionId: string;
      studentAnswer: string;
      correctAnswer: string;
      explanation: string | null;
    }[] = [];

    /*
     * Mark only questions that belong to the exam.
     * Correct answers are read exclusively from the database.
     */
    for (const examQuestion of exam.questions) {
      const question = examQuestion.question;

      const submittedAnswer =
        answers[question.id];

      const studentAnswer =
        submittedAnswer
          ? submittedAnswer.toUpperCase()
          : null;

      const correctAnswer =
        question.correctAnswer.toUpperCase();

      const marks = examQuestion.marks;

      totalMarks += marks;

      let isCorrect: boolean | null = null;
      let marksAwarded = 0;

      if (!studentAnswer) {
        unanswered++;
      } else if (
        studentAnswer === correctAnswer
      ) {
        isCorrect = true;
        marksAwarded = marks;

        score += marks;
        correctAnswers++;
      } else {
        isCorrect = false;
        wrongAnswers++;

        mistakeRecords.push({
          questionId: question.id,
          studentAnswer,
          correctAnswer,
          explanation: question.explanation,
        });
      }

      answerRecords.push({
        questionId: question.id,
        answer: studentAnswer,
        isCorrect,
        marksAwarded,
        answeredAt: studentAnswer
          ? now
          : null,
      });
    }

    const percentage =
      totalMarks > 0
        ? Number(
            ((score / totalMarks) * 100).toFixed(2)
          )
        : 0;

    let timeUsedSeconds: number | null = null;

    if (exam.startedAt) {
      const elapsedSeconds = Math.floor(
        (now.getTime() -
          exam.startedAt.getTime()) /
          1000
      );

      timeUsedSeconds = Math.max(
        0,
        Math.min(
          elapsedSeconds,
          exam.durationMinutes * 60
        )
      );
    }

    /*
     * Create answers, result, mistakes and final exam status
     * inside one transaction.
     */
    const result = await prisma.$transaction(
      async (tx) => {
        /*
         * Re-check the exam status inside the transaction.
         *
         * This protects against two submission requests
         * arriving almost simultaneously.
         */
        const currentExam =
          await tx.exam.findUnique({
            where: {
              id: exam.id,
            },
            select: {
              status: true,
            },
          });

        if (
          !currentExam ||
          currentExam.status === "SUBMITTED" ||
          currentExam.status === "AUTO_SUBMITTED" ||
          currentExam.status === "MARKED"
        ) {
          throw new Error(
            "EXAM_ALREADY_SUBMITTED"
          );
        }

        for (const answerRecord of answerRecords) {
          await tx.studentAnswer.upsert({
            where: {
              examId_questionId: {
                examId: exam.id,
                questionId:
                  answerRecord.questionId,
              },
            },

            update: {
              answer: answerRecord.answer,
              isCorrect:
                answerRecord.isCorrect,
              marksAwarded:
                answerRecord.marksAwarded,
              answeredAt:
                answerRecord.answeredAt,
            },

            create: {
              examId: exam.id,
              questionId:
                answerRecord.questionId,
              answer: answerRecord.answer,
              isCorrect:
                answerRecord.isCorrect,
              marksAwarded:
                answerRecord.marksAwarded,
              answeredAt:
                answerRecord.answeredAt,
            },
          });
        }

        const newResult =
          await tx.result.create({
            data: {
              examId: exam.id,
              userId,
              score,
              totalMarks,
              percentage,
              correctAnswers,
              wrongAnswers,
              unanswered,
              timeUsedSeconds,
            },
          });

        if (mistakeRecords.length > 0) {
          await tx.mistake.createMany({
            data: mistakeRecords.map(
              (mistake) => ({
                resultId: newResult.id,
                questionId: mistake.questionId,
                studentAnswer:
                  mistake.studentAnswer,
                correctAnswer:
                  mistake.correctAnswer,
                explanation:
                  mistake.explanation,
              })
            ),
          });
        }

        await tx.exam.update({
          where: {
            id: exam.id,
          },

          data: {
            status: finalAutoSubmit
              ? "AUTO_SUBMITTED"
              : "SUBMITTED",

            submittedAt: now,
          },
        });

        return newResult;
      }
    );

    return NextResponse.json(
      {
        success: true,

        message: finalAutoSubmit
          ? "Your test was automatically submitted because the time expired."
          : "Your test was submitted successfully.",

        result: {
          id: result.id,
          score: result.score,
          totalMarks: result.totalMarks,
          percentage: result.percentage,
          correctAnswers:
            result.correctAnswers,
          wrongAnswers:
            result.wrongAnswers,
          unanswered:
            result.unanswered,
          timeUsedSeconds:
            result.timeUsedSeconds,
        },
      },

      { status: 201 }
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message ===
        "EXAM_ALREADY_SUBMITTED"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This test has already been submitted.",
        },
        { status: 409 }
      );
    }

    console.error(
      "Exam submission error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Something went wrong while submitting the test.",
      },
      { status: 500 }
    );
  }
}