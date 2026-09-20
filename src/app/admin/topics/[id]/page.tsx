import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import TopicActions from "./TopicActions";

interface TopicPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function TopicPage({
  params,
}: TopicPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
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

  if (!admin || !admin.isActive || admin.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const { id } = await params;

  const topic = await prisma.topic.findUnique({
    where: {
      id,
    },
    include: {
      subject: {
        select: {
          id: true,
          name: true,
          isActive: true,
        },
      },
      _count: {
        select: {
          questions: true,
        },
      },
    },
  });

  if (!topic) {
    notFound();
  }

  const subjects = await prisma.subject.findMany({
    where: {
      OR: [
        { isActive: true },
        { id: topic.subjectId },
      ],
    },
    select: {
      id: true,
      name: true,
      isActive: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/admin/topics"
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              ← Back to Topics
            </Link>

            <h1 className="mt-2 text-3xl font-bold text-slate-900">
              Manage Topic
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Edit the topic name, description and subject.
            </p>
          </div>

          <div className="rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Topic ID
            </p>

            <p className="mt-1 max-w-[240px] truncate text-sm font-semibold text-slate-700">
              {topic.id}
            </p>
          </div>
        </div>

        {/* Topic summary */}
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm font-medium text-slate-500">
              Topic
            </p>

            <p className="mt-2 text-lg font-bold text-slate-900">
              {topic.name}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm font-medium text-slate-500">
              Subject
            </p>

            <p className="mt-2 text-lg font-bold text-slate-900">
              {topic.subject.name}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm font-medium text-slate-500">
              Questions
            </p>

            <p className="mt-2 text-lg font-bold text-blue-600">
              {topic._count.questions}
            </p>
          </div>
        </div>

        {/* Management form */}
        <TopicActions
          topic={{
            id: topic.id,
            name: topic.name,
            description: topic.description,
            subjectId: topic.subjectId,
            questionCount: topic._count.questions,
          }}
          subjects={subjects}
        />
      </div>
    </main>
  );
}