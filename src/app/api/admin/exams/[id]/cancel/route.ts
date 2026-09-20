import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
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
        { status: 403 }
      );
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          message: "Exam ID is required.",
        },
        { status: 400 }
      );
    }

    const exam = await prisma.exam.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        status: true,
        submittedAt: true,
      },
    });

    if (!exam) {
      return NextResponse.json(
        {
          message: "Exam not found.",
        },
        { status: 404 }
      );
    }

    if (
      exam.status !== "NOT_STARTED" &&
      exam.status !== "IN_PROGRESS"
    ) {
      return NextResponse.json(
        {
          message:
            "Only exams that have not been completed can be cancelled.",
        },
        { status: 400 }
      );
    }

    const submittedAt = new Date();

    const updatedExam = await prisma.exam.update({
      where: {
        id: exam.id,
      },
      data: {
        status: "AUTO_SUBMITTED",
        submittedAt,
      },
      select: {
        id: true,
        status: true,
        submittedAt: true,
      },
    });

    return NextResponse.json({
      message: "Exam cancelled successfully.",
      exam: updatedExam,
    });
  } catch (error) {
    console.error("Admin cancel exam error:", error);

    return NextResponse.json(
      {
        message: "An unexpected error occurred.",
      },
      { status: 500 }
    );
  }
}