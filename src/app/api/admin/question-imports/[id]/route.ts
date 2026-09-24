import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

interface ImportRouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(
  request: Request,
  context: ImportRouteContext
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized." },
        { status: 401 }
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
        { message: "Forbidden." },
        { status: 403 }
      );
    }

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { message: "Import ID is required." },
        { status: 400 }
      );
    }

    const questionImport =
      await prisma.questionImport.findUnique({
        where: {
          id,
        },
        select: {
          id: true,
          fileName: true,
          fileType: true,
          fileSize: true,
          status: true,
          errorMessage: true,
          totalItems: true,
          extractedText: true,
          createdAt: true,
          updatedAt: true,
          items: {
            select: {
              id: true,
              questionText: true,
              optionA: true,
              optionB: true,
              optionC: true,
              optionD: true,
              correctAnswer: true,
              explanation: true,
              suggestedClassLevel: true,
              suggestedExamType: true,
              suggestedBeceYear: true,
              suggestedTopicId: true,
              status: true,
              reviewNotes: true,
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
          message:
            "Question import record not found.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        import: questionImport,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "Question import inspection error:",
      error
    );

    return NextResponse.json(
      {
        message:
          "An unexpected error occurred while retrieving the question import.",
      },
      { status: 500 }
    );
  }
}