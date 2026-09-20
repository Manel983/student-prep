import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(
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
        { status: 401 }
      );
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        {
          message: "Forbidden.",
        },
        { status: 403 }
      );
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          message: "Question ID is required.",
        },
        { status: 400 }
      );
    }

    const existingQuestion = await prisma.question.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        questionText: true,
        status: true,
        subjectId: true,
      },
    });

    if (!existingQuestion) {
      return NextResponse.json(
        {
          message: "Question not found.",
        },
        { status: 404 }
      );
    }

    if (existingQuestion.status !== "DRAFT") {
      return NextResponse.json(
        {
          message:
            "Only draft questions can be published.",
        },
        { status: 400 }
      );
    }

    const subject = await prisma.subject.findUnique({
      where: {
        id: existingQuestion.subjectId,
      },
      select: {
        id: true,
        isActive: true,
      },
    });

    if (!subject) {
      return NextResponse.json(
        {
          message: "The question's subject was not found.",
        },
        { status: 404 }
      );
    }

    if (!subject.isActive) {
      return NextResponse.json(
        {
          message:
            "Questions cannot be published under an inactive subject.",
        },
        { status: 400 }
      );
    }

    const question = await prisma.question.update({
      where: {
        id,
      },
      data: {
        status: "PUBLISHED",
      },
      select: {
        id: true,
        questionText: true,
        status: true,
      },
    });

    return NextResponse.json({
      message: "Question published successfully.",
      question,
    });
  } catch (error) {
    console.error("Publish question error:", error);

    return NextResponse.json(
      {
        message: "An unexpected error occurred.",
      },
      { status: 500 }
    );
  }
}
