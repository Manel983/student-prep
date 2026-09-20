import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import EditQuestionForm from "./EditQuestionForm";

interface QuestionPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function QuestionPage({
  params,
}: QuestionPageProps) {
  const session = await auth();

  // Require login
  if (!session?.user?.id) {
    redirect("/login");
  }

  // Verify admin from database
  const admin = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      role: true,
      isActive: true,
    },
  });

  if (!admin || !admin.isActive || admin.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const { id } = await params;

  // Fetch the question
  const question = await prisma.question.findUnique({
    where: {
      id,
    },
    include: {
      subject: {
        select: {
          id: true,
          name: true,
        },
      },
      topic: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  // Question does not exist
  if (!question) {
    notFound();
  }

  // Fetch active subjects and their topics
  const subjects = await prisma.subject.findMany({
    where: {
      isActive: true,
    },
    include: {
      topics: {
        orderBy: {
          name: "asc",
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/admin/questions"
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              ← Back to Question Bank
            </Link>

            <h1 className="mt-2 text-2xl font-bold text-slate-900">
              Manage Question
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Edit question details, answers, difficulty and publication status.
            </p>
          </div>

          <div className="rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Question ID
            </p>
            <p className="mt-1 max-w-[220px] truncate text-sm font-semibold text-slate-700">
              {question.id}
            </p>
          </div>
        </div>

        {/* Question Form */}
        <EditQuestionForm
          question={{
            id: question.id,
            subjectId: question.subjectId,
            topicId: question.topicId,
            questionText: question.questionText,
            optionA: question.optionA,
            optionB: question.optionB,
            optionC: question.optionC,
            optionD: question.optionD,
            correctAnswer: question.correctAnswer,
            explanation: question.explanation,
            difficulty: question.difficulty,
            marks: question.marks,
            status: question.status,
          }}
          subjects={subjects}
        />
      </div>
    </main>
  );
}