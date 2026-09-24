import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const bulkPublishSchema = z.object({
  questionIds: z
    .array(z.string().min(1))
    .min(1, "Please select at least one question.")
    .max(10000, "You cannot publish more than 10,000 questions at once."),
});

export async function POST(request: Request) {
  try {
    // ---------------------------------------------------------
    // Authentication
    // ---------------------------------------------------------

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

    // ---------------------------------------------------------
    // Admin authorization
    // ---------------------------------------------------------

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        {
          message: "Forbidden.",
        },
        {
          status: 403,
        }
      );
    }

    // ---------------------------------------------------------
    // Validate request body
    // ---------------------------------------------------------

    const body = await request.json();

    const validation = bulkPublishSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          message:
            validation.error.issues[0]?.message ||
            "Invalid request.",
        },
        {
          status: 400,
        }
      );
    }

    // ---------------------------------------------------------
    // Remove duplicate IDs
    // ---------------------------------------------------------

    const questionIds = [
      ...new Set(validation.data.questionIds),
    ];

    // ---------------------------------------------------------
    // Verify that the selected questions actually exist
    // ---------------------------------------------------------

    const questions = await prisma.question.findMany({
      where: {
        id: {
          in: questionIds,
        },
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (questions.length !== questionIds.length) {
      const foundIds = new Set(
        questions.map((question) => question.id)
      );

      const missingIds = questionIds.filter(
        (id) => !foundIds.has(id)
      );

      return NextResponse.json(
        {
          message:
            "One or more selected questions could not be found.",
          missingQuestionIds: missingIds,
        },
        {
          status: 400,
        }
      );
    }

    // ---------------------------------------------------------
    // Determine which questions can be published
    // ---------------------------------------------------------

    const publishableQuestions = questions.filter(
      (question) => question.status === "DRAFT"
    );

    const alreadyPublishedCount = questions.filter(
      (question) => question.status === "PUBLISHED"
    ).length;

    const archivedCount = questions.filter(
      (question) => question.status === "ARCHIVED"
    ).length;

    // ---------------------------------------------------------
    // Nothing to publish
    // ---------------------------------------------------------

    if (publishableQuestions.length === 0) {
      return NextResponse.json(
        {
          message:
            "None of the selected questions are in Draft status.",
          publishedCount: 0,
          alreadyPublishedCount,
          archivedCount,
          selectedCount: questionIds.length,
        },
        {
          status: 200,
        }
      );
    }

    // ---------------------------------------------------------
    // Publish selected Draft questions
    // ---------------------------------------------------------

    const result = await prisma.question.updateMany({
      where: {
        id: {
          in: publishableQuestions.map(
            (question) => question.id
          ),
        },
        status: "DRAFT",
      },
      data: {
        status: "PUBLISHED",
      },
    });

    return NextResponse.json(
      {
        message: `${result.count} question${
          result.count === 1 ? "" : "s"
        } published successfully.`,
        publishedCount: result.count,
        alreadyPublishedCount,
        archivedCount,
        selectedCount: questionIds.length,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("Bulk publish questions error:", error);

    return NextResponse.json(
      {
        message:
          "An unexpected error occurred while publishing questions.",
      },
      {
        status: 500,
      }
    );
  }
}