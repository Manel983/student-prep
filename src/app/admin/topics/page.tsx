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

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Topics Management
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Create, edit and organize topics under your subjects.
            </p>
          </div>

          <Link
            href="/admin/topics/new"
            className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            + Add Topic
          </Link>
        </div>

        {/* Statistics */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm font-medium text-slate-500">
              Total Topics
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {totalTopics}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm font-medium text-slate-500">
              Topics Shown
            </p>

            <p className="mt-2 text-3xl font-bold text-blue-600">
              {topics.length}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm font-medium text-slate-500">
              With Questions
            </p>

            <p className="mt-2 text-3xl font-bold text-emerald-600">
              {topicsWithQuestions}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm font-medium text-slate-500">
              Total Questions
            </p>

            <p className="mt-2 text-3xl font-bold text-purple-600">
              {totalQuestions}
            </p>
          </div>
        </div>

        {/* Filters */}
        <section className="mb-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
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
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
              className="self-end rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
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
          <section className="rounded-2xl bg-white px-6 py-16 text-center shadow-sm ring-1 ring-slate-200">
            <div className="text-5xl">📚</div>

            <h2 className="mt-4 text-xl font-bold text-slate-900">
              No topics found
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              {search || subjectId
                ? "Try changing your search or subject filter."
                : "Create your first topic to start organizing questions."}
            </p>

            {!search && !subjectId && (
              <Link
                href="/admin/topics/new"
                className="mt-6 inline-flex rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
              >
                + Create First Topic
              </Link>
            )}
          </section>
        ) : (
          /* Topics table */
          <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
            <div className="border-b border-slate-200 px-6 py-5">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-bold text-slate-900">
                    Topics
                  </h2>

                  <p className="text-sm text-slate-500">
                    Showing {topics.length} topic
                    {topics.length === 1 ? "" : "s"}
                  </p>
                </div>

                <p className="text-xs text-slate-400">
                  {emptyTopics} topic
                  {emptyTopics === 1 ? "" : "s"} without questions
                </p>
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
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                          {topic._count.questions}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        {topic.subject.isActive ? (
                          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                            Active
                          </span>
                        ) : (
                          <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-600">
                            Inactive
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <Link
                          href={`/admin/topics/${topic.id}`}
                          className="font-semibold text-blue-600 hover:text-blue-800"
                        >
                          Manage →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}