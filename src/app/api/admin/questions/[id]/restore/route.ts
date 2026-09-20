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

    if (existingQuestion.status !== "ARCHIVED") {
      return NextResponse.json(
        {
          message:
            "Only archived questions can be restored.",
        },
        { status: 400 }
      );
    }

    const question = await prisma.question.update({
      where: {
        id,
      },
      data: {
        status: "DRAFT",
      },
      select: {
        id: true,
        questionText: true,
        status: true,
      },
    });

    return NextResponse.json({
      message: "Question restored successfully.",
      question,
    });
  } catch (error) {
    console.error("Restore question error:", error);

    return NextResponse.json(
      {
        message: "An unexpected error occurred.",
      },
      { status: 500 }
    );
  }
}