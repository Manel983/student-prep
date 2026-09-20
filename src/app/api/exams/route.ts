import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      role: true,
      isActive: true,
    },
  });

  if (!user || !user.isActive || user.role !== "ADMIN") {
    return null;
  }

  return user;
}

export async function GET() {
  const admin = await requireAdmin();

  if (!admin) {
    return NextResponse.json(
      { message: "Unauthorized." },
      { status: 401 }
    );
  }

  try {
    const exams = await prisma.exam.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        subject: {
          select: {
            id: true,
            name: true,
          },
        },
        result: {
          select: {
            score: true,
            totalMarks: true,
            percentage: true,
            correctAnswers: true,
            wrongAnswers: true,
            unanswered: true,
            timeUsedSeconds: true,
            completedAt: true,
          },
        },
        _count: {
          select: {
            questions: true,
            answers: true,
          },
        },
      },
    });

    return NextResponse.json({
      exams,
    });
  } catch (error) {
    console.error("Admin exams GET error:", error);

    return NextResponse.json(
      { message: "Failed to load exams." },
      { status: 500 }
    );
  }
}