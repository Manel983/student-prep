import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import ExamClient from "./ExamClient";

interface ExamPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ExamPage({
  params,
}: ExamPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { id } = await params;

  const exam = await prisma.exam.findFirst({
    where: {
      id,
      userId: session.user.id,
    },
    include: {
      subject: {
        select: {
          name: true,
        },
      },
      questions: {
        orderBy: {
          questionNo: "asc",
        },
        select: {
          id: true,
          questionNo: true,
          marks: true,
          question: {
            select: {
              id: true,
              questionText: true,
              optionA: true,
              optionB: true,
              optionC: true,
              optionD: true,
            },
          },
        },
      },
    },
  });

  if (!exam) {
    redirect("/dashboard");
  }

  if (
    exam.status === "SUBMITTED" ||
    exam.status === "AUTO_SUBMITTED" ||
    exam.status === "MARKED"
  ) {
    redirect("/dashboard");
  }

  const now = new Date();

  if (exam.expiresAt && exam.expiresAt <= now) {
    redirect("/dashboard");
  }

  const safeExam = {
    id: exam.id,
    title: exam.title,
    durationMinutes: exam.durationMinutes,
    totalQuestions: exam.totalQuestions,
    startedAt: exam.startedAt?.toISOString() ?? now.toISOString(),
    expiresAt: exam.expiresAt?.toISOString() ?? now.toISOString(),
    subject: {
      name: exam.subject.name,
    },
    questions: exam.questions.map((item) => ({
      id: item.question.id,
      questionNo: item.questionNo,
      marks: item.marks,
      questionText: item.question.questionText,
      optionA: item.question.optionA,
      optionB: item.question.optionB,
      optionC: item.question.optionC,
      optionD: item.question.optionD,
    })),
  };

  return <ExamClient exam={safeExam} />;
}