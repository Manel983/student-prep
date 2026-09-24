import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

interface TopicsPageProps {
  searchParams: Promise<{
    search?: string;
    subjectId?: string;
  }>;
}

export default async function TopicsPage({
  searchParams,
}: TopicsPageProps) {
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

  const params = await searchParams;

  const search = params.search?.trim() || "";
  const subjectId = params.subjectId?.trim() || "";

  const where = {
    ...(search
      ? {
          OR: [
            {
              name: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
            {
              description: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
            {
              subject: {
                name: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
            },
          ],
        }
      : {}),
    ...(subjectId
      ? {
          subjectId,
        }
      : {}),
  };

  const [topics, subjects, totalTopics, totalQuestions] =
    await Promise.all([
      prisma.topic.findMany({
        where,
        orderBy: [
          {
            subject: {
              name: "asc",
            },
          },
          {
            name: "asc",
          },
        ],
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
      }),

      prisma.subject.findMany({
        orderBy: {
          name: "asc",
        },
        select: {
          id: true,
          name: true,
          isActive: true,
        },
      }),

      prisma.topic.count(),

      prisma.question.count(),
    ]);

  const topicsWithQuestions = topics.filter(
    (topic) => topic._count.questions > 0
  ).length;

  const emptyTopics = topics.filter(
    (topic) => topic._count.questions === 0
  ).length;

  const activeSubjects = subjects.filter(
    (subject) => subject.isActive
  ).length;

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex items-start gap-4">
            <img
              src="/logo.jpg"
              alt="Student Prep"
              className="h-11 w-auto object-contain"
            />

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900">
                  Topics Management
                </h1>

                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  Admin
                </span>
              </div>

              <p className="mt-1 text-sm text-slate-500">
                Create, edit and organize topics under your subjects.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin"
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Dashboard
            </Link>

            <Link
              href="/admin/topics/new"
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              + Add Topic
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Overview */}
        <section className="mb-8">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-slate-900">
              Topic Overview
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Monitor your topic structure and question coverage.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">
                  Total Topics
                </p>

                <span className="rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs font-bold text-blue-700">
                  ALL
                </span>
              </div>

              <p className="mt-3 text-3xl font-bold text-slate-900">
                {totalTopics}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Across all subjects
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">
                  Topics Shown
                </p>

                <span className="rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs font-bold text-blue-700">
                  VIEW
                </span>
              </div>

              <p className="mt-3 text-3xl font-bold text-blue-600">
                {topics.length}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Matching current filters
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">
                  With Questions
                </p>

                <span className="rounded-lg bg-green-50 px-2.5 py-1.5 text-xs font-bold text-green-700">
                  READY
                </span>
              </div>

              <p className="mt-3 text-3xl font-bold text-green-600">
                {topicsWithQuestions}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Topics containing questions
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">
                  Empty Topics
                </p>

                <span className="rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-bold text-red-700">
                  REVIEW
                </span>
              </div>

              <p className="mt-3 text-3xl font-bold text-red-600">
                {emptyTopics}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Topics without questions
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">
                  Questions
                </p>

                <span className="rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs font-bold text-blue-700">
                  BANK
                </span>
              </div>

              <p className="mt-3 text-3xl font-bold text-slate-900">
                {totalQuestions}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Total question bank
              </p>
            </div>
          </div>
        </section>

        {/* Subject summary */}
        <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-bold text-slate-900">
                Subject Coverage
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Subjects available for topic organization.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 text-xs font-semibold">
              <span className="rounded-full bg-green-50 px-3 py-1.5 text-green-700">
                {activeSubjects} active
              </span>

              <span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-600">
                {subjects.length - activeSubjects} inactive
              </span>
            </div>
          </div>
        </section>

        {/* Filters */}
        <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="font-bold text-slate-900">
              Find Topics
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Search by topic, description or subject and filter by subject.
            </p>
          </div>

          <form
            method="GET"
            className="grid gap-4 lg:grid-cols-[1fr_280px_auto_auto]"
          >
            <div>
              <label
                htmlFor="search"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Search
              </label>

              <input
                id="search"
                name="search"
                defaultValue={search}
                placeholder="Search topics or subjects..."
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                htmlFor="subjectId"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Subject
              </label>

              <select
                id="subjectId"
                name="subjectId"
                defaultValue={subjectId}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">All subjects</option>

                {subjects.map((subject) => (
                  <option
                    key={subject.id}
                    value={subject.id}
                  >
                    {subject.name}
                    {!subject.isActive ? " (Inactive)" : ""}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="self-end rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Search
            </button>

            <Link
              href="/admin/topics"
              className="self-end rounded-xl border border-slate-300 bg-white px-5 py-3 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Clear
            </Link>
          </form>
        </section>

        {/* Empty state */}
        {topics.length === 0 ? (
          <section className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-3xl">
              📚
            </div>

            <h2 className="mt-5 text-xl font-bold text-slate-900">
              No topics found
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              {search || subjectId
                ? "Try changing your search or subject filter."
                : "Create your first topic to start organizing questions."}
            </p>

            {!search && !subjectId && (
              <Link
                href="/admin/topics/new"
                className="mt-6 inline-flex rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                + Create First Topic
              </Link>
            )}
          </section>
        ) : (
          /* Topics table */
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-bold text-slate-900">
                    Topics
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Showing {topics.length} topic
                    {topics.length === 1 ? "" : "s"}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {emptyTopics > 0 && (
                    <span className="rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700">
                      {emptyTopics} without questions
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                      Topic
                    </th>

                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                      Subject
                    </th>

                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                      Questions
                    </th>

                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                      Subject Status
                    </th>

                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200">
                  {topics.map((topic) => (
                    <tr
                      key={topic.id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-slate-900">
                            {topic.name}
                          </p>

                          <p className="mt-1 max-w-md truncate text-sm text-slate-500">
                            {topic.description ||
                              "No description"}
                          </p>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className="font-medium text-slate-700">
                          {topic.subject.name}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        {topic._count.questions > 0 ? (
                          <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                            {topic._count.questions}
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700">
                            0
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        {topic.subject.isActive ? (
                          <span className="inline-flex rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                            Inactive
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <Link
                          href={`/admin/topics/${topic.id}`}
                          className="inline-flex items-center rounded-lg px-3 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-50 hover:text-blue-800"
                        >
                          Manage
                          <span className="ml-1">→</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile-friendly summary */}
            <div className="border-t border-slate-200 bg-slate-50 px-6 py-4">
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-500">
                <span>
                  <strong className="text-slate-700">
                    {topics.length}
                  </strong>{" "}
                  topics shown
                </span>

                <span>
                  <strong className="text-green-700">
                    {topicsWithQuestions}
                  </strong>{" "}
                  with questions
                </span>

                <span>
                  <strong className="text-red-700">
                    {emptyTopics}
                  </strong>{" "}
                  need questions
                </span>
              </div>
            </div>
          </section>
        )}

        {/* Navigation */}
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/admin"
            className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            ← Admin Dashboard
          </Link>

          <Link
            href="/admin/subjects"
            className="rounded-xl border border-blue-200 bg-blue-50 px-5 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
          >
            Manage Subjects
          </Link>

          <Link
            href="/admin/questions"
            className="rounded-xl border border-green-200 bg-green-50 px-5 py-3 text-sm font-semibold text-green-700 transition hover:bg-green-100"
          >
            Manage Questions
          </Link>
        </div>
      </div>
    </main>
  );
}