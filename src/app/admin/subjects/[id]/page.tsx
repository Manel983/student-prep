import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import SubjectActions from "./SubjectActions";

interface SubjectPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function SubjectPage({
  params,
}: SubjectPageProps) {
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

  const subject = await prisma.subject.findUnique({
    where: {
      id,
    },
    include: {
      _count: {
        select: {
          topics: true,
          questions: true,
          exams: true,
        },
      },
      topics: {
        orderBy: {
          name: "asc",
        },
        include: {
          _count: {
            select: {
              questions: true,
            },
          },
        },
      },
    },
  });

  if (!subject) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/admin/subjects"
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              ← Back to Subjects
            </Link>

            <h1 className="mt-3 text-3xl font-bold text-slate-900">
              {subject.name}
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage subject details, status and related content.
            </p>
          </div>

          <div>
            {subject.isActive ? (
              <span className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700">
                Active
              </span>
            ) : (
              <span className="rounded-full bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-600">
                Inactive
              </span>
            )}
          </div>
        </div>

        {/* Statistics */}
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm font-medium text-slate-500">
              Topics
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {subject._count.topics}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm font-medium text-slate-500">
              Questions
            </p>

            <p className="mt-2 text-3xl font-bold text-blue-600">
              {subject._count.questions}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm font-medium text-slate-500">
              Exams
            </p>

            <p className="mt-2 text-3xl font-bold text-purple-600">
              {subject._count.exams}
            </p>
          </div>
        </div>

        {/* Subject information */}
        <div className="mb-6 grid gap-6 lg:grid-cols-[1fr_350px]">
          <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-lg font-bold text-slate-900">
              Subject Information
            </h2>

            <div className="mt-5 space-y-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Name
                </p>

                <p className="mt-1 font-semibold text-slate-800">
                  {subject.name}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Description
                </p>

                <p className="mt-1 text-sm leading-6 text-slate-600">
                  {subject.description ||
                    "No description has been provided for this subject."}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Created
                </p>

                <p className="mt-1 text-sm text-slate-600">
                  {subject.createdAt.toLocaleDateString()}
                </p>
              </div>
            </div>
          </section>

          <SubjectActions
            subject={{
              id: subject.id,
              name: subject.name,
              description: subject.description,
              isActive: subject.isActive,
              topicCount: subject._count.topics,
              questionCount: subject._count.questions,
              examCount: subject._count.exams,
            }}
          />
        </div>

        {/* Topics */}
        <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="font-bold text-slate-900">
              Topics
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Topics currently associated with this subject.
            </p>
          </div>

          {subject.topics.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="text-4xl">📚</div>

              <h3 className="mt-3 font-semibold text-slate-900">
                No topics yet
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Topics can be added from the Topics Management section.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {subject.topics.map((topic) => (
                <div
                  key={topic.id}
                  className="flex items-center justify-between gap-4 px-6 py-4"
                >
                  <div>
                    <p className="font-semibold text-slate-800">
                      {topic.name}
                    </p>

                    {topic.description && (
                      <p className="mt-1 text-sm text-slate-500">
                        {topic.description}
                      </p>
                    )}
                  </div>

                  <span className="shrink-0 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                    {topic._count.questions} question
                    {topic._count.questions === 1 ? "" : "s"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}