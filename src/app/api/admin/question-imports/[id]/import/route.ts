import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(
  request: Request,
  { params }: RouteContext
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          message: "Unauthorized.",
        },
        {
          status: 401,
        }
      );
    }

    const admin = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        role: true,
        isActive: true,
      },
    });

    if (
      !admin ||
      !admin.isActive ||
      admin.role !== "ADMIN"
    ) {
      return NextResponse.json(
        {
          message: "Forbidden.",
        },
        {
          status: 403,
        }
      );
    }

    const { id } = await params;

    const questionImport =
      await prisma.questionImport.findUnique({
        where: {
          id,
        },
        include: {
          items: {
            where: {
              status: {
                not: "REJECTED",
              },
            },
            orderBy: {
              createdAt: "asc",
            },
          },
        },
      });

    if (!questionImport) {
      return NextResponse.json(
        {
          message: "Question import not found.",
        },
        {
          status: 404,
        }
      );
    }

    if (questionImport.status !== "READY_FOR_REVIEW") {
      return NextResponse.json(
        {
          message:
            "This import is not ready for final import.",
        },
        {
          status: 400,
        }
      );
    }

    if (questionImport.items.length === 0) {
      return NextResponse.json(
        {
          message:
            "There are no questions available for import.",
        },
        {
          status: 400,
        }
      );
    }

    const validItems =
      questionImport.items.filter(
        (item) =>
          item.suggestedClassLevel !== null &&
          item.suggestedExamType !== null &&
          item.suggestedTopicId !== null &&
          item.questionText.trim() &&
          item.optionA.trim() &&
          item.optionB.trim() &&
          item.optionC.trim() &&
          item.optionD.trim() &&
          item.correctAnswer !== null &&
          item.correctAnswer.trim()
      );

    if (validItems.length === 0) {
      return NextResponse.json(
        {
          message:
            "No complete questions are available for import.",
        },
        {
          status: 400,
        }
      );
    }

    const topicIds = [
      ...new Set(
        validItems
          .map((item) => item.suggestedTopicId)
          .filter(
            (topicId): topicId is string =>
              Boolean(topicId)
          )
      ),
    ];

    const topics = await prisma.topic.findMany({
      where: {
        id: {
          in: topicIds,
        },
      },
      select: {
        id: true,
        subjectId: true,
      },
    });

    const topicMap = new Map(
      topics.map((topic) => [
        topic.id,
        topic,
      ])
    );

    const questionsToCreate = validItems
      .map((item) => {
        const classLevel =
          item.suggestedClassLevel;

        const examType =
          item.suggestedExamType;

        const topicId =
          item.suggestedTopicId;

        const correctAnswer =
          item.correctAnswer;

        if (
          !classLevel ||
          !examType ||
          !topicId ||
          !correctAnswer
        ) {
          return null;
        }

        const topic = topicMap.get(topicId);

        if (!topic) {
          return null;
        }

        return {
          subjectId: topic.subjectId,
          topicId: topic.id,

          questionText:
            item.questionText.trim(),

          optionA: item.optionA.trim(),
          optionB: item.optionB.trim(),
          optionC: item.optionC.trim(),
          optionD: item.optionD.trim(),

          correctAnswer:
            correctAnswer.trim(),

          explanation:
            item.explanation?.trim() || null,

          classLevel,

          examType,

          beceYear:
            examType === "BECE"
              ? item.suggestedBeceYear
              : null,

          marks: 1,

          status: "DRAFT" as const,
        };
      })
      .filter(
        (
          question
        ): question is NonNullable<
          typeof question
        > => question !== null
      );

    if (questionsToCreate.length === 0) {
      return NextResponse.json(
        {
          message:
            "No valid questions could be prepared for import.",
        },
        {
          status: 400,
        }
      );
    }

    const result =
      await prisma.$transaction(
        async (tx) => {
          const created =
            await tx.question.createMany({
              data: questionsToCreate,
            });

          await tx.questionImportItem.updateMany({
            where: {
              importId: questionImport.id,
              id: {
                in: validItems.map(
                  (item) => item.id
                ),
              },
            },
            data: {
              status: "IMPORTED",
            },
          });

          await tx.questionImport.update({
            where: {
              id: questionImport.id,
            },
            data: {
              status: "IMPORTED",
              totalItems: created.count,
            },
          });

          return created;
        }
      );

    return NextResponse.json(
      {
        message:
          "Questions imported successfully.",
        importedCount: result.count,
        importId: questionImport.id,
        status: "IMPORTED",
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Question import error:",
      error
    );

    return NextResponse.json(
      {
        message:
          "An unexpected error occurred while importing questions.",
      },
      {
        status: 500,
      }
    );
  }
}