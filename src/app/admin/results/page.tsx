import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

interface AdminResultsPageProps {
  searchParams: Promise<{
    search?: string;
    subjectId?: string;
  }>;
}

function formatDate(date: Date | null | undefined) {
  if (!date) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-GH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatPercentage(
  value: string | number | null | undefined | { toString(): string }
) {
  if (value === null || value === undefined) {
    return "—";
  }

  return `${Number(value.toString()).toFixed(1)}%`;
}

function formatDuration(seconds: number | null | undefined) {
  if (seconds === null || seconds === undefined) {
    return "—";
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${minutes}m ${remainingSeconds}s`;
}

export default async function AdminResultsPage({
  searchParams,
}: AdminResultsPageProps) {
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
  const subjectId = params.subjectId || "";

  const [results, subjects] = await Promise.all([
    prisma.result.findMany({
      where: {
        ...(search
          ? {
              OR: [
                {
                  user: {
                    email: {
                      contains: search,
                      mode: "insensitive",
                    },
                  },
                },
                {
                  user: {
                    firstName: {
                      contains: search,
                      mode: "insensitive",
                    },
                  },
                },
                {
                  user: {
                    lastName: {
                      contains: search,
                      mode: "insensitive",
                    },
                  },
                },
                {
                  exam: {
                    title: {
                      contains: search,
                      mode: "insensitive",
                    },
                  },
                },
              ],
            }
          : {}),
        ...(subjectId
          ? {
              exam: {
                subjectId,
              },
            }
          : {}),
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
        exam: {
          select: {
            id: true,
            title: true,
            subject: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        completedAt: "desc",
      },
    }),
    prisma.subject.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    }),
  ]);

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Results
            </h1>

            <p className="mt-2 text-slate-600">
              View and monitor student examination results.
            </p>
          </div>

          <Link
            href="/admin"
            className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            ← Admin Dashboard
          </Link>
        </div>

        {/* Filters */}
        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Filter Results
          </h2>

          <form
            method="GET"
            className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-4"
          >
            <div className="lg:col-span-3">
              <label
                htmlFor="search"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Search
              </label>

              <input
                id="search"
                type="search"
                name="search"
                defaultValue={search}
                placeholder="Search student name, email or exam..."
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                htmlFor="subjectId"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Subject
              </label>

              <select
                id="subjectId"
                name="subjectId"
                defaultValue={subjectId}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">All Subjects</option>

                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-3 md:col-span-2 lg:col-span-4 sm:flex-row">
              <button
                type="submit"
                className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Apply Filters
              </button>

              {(search || subjectId) && (
                <Link
                  href="/admin/results"
                  className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Clear Filters
                </Link>
              )}
            </div>
          </form>
        </section>

        {/* Result Count */}
        <div className="mb-4">
          <p className="text-sm text-slate-600">
            Showing{" "}
            <span className="font-semibold text-slate-900">
              {results.length}
            </span>{" "}
            {results.length === 1 ? "result" : "results"}.
          </p>
        </div>

        {/* Results Table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    Student
                  </th>

                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    Exam
                  </th>

                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    Subject
                  </th>

                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    Score
                  </th>

                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    Percentage
                  </th>

                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    Correct
                  </th>

                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    Wrong
                  </th>

                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    Unanswered
                  </th>

                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    Time Used
                  </th>

                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    Completed
                  </th>

                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {results.map((result) => (
                  <tr
                    key={result.id}
                    className="hover:bg-slate-50"
                  >
                    <td className="px-6 py-4">
                      <p className="whitespace-nowrap font-medium text-slate-900">
                        {result.user.firstName}{" "}
                        {result.user.lastName}
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        {result.user.email}
                      </p>
                    </td>

                    <td className="max-w-xs px-6 py-4">
                      <p className="font-medium text-slate-900">
                        {result.exam.title}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        ID: {result.exam.id}
                      </p>
                    </td>

                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                      {result.exam.subject.name}
                    </td>

                    <td className="whitespace-nowrap px-6 py-4">
                      <span className="font-semibold text-slate-900">
                        {result.score}/{result.totalMarks}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-6 py-4">
                      <span className="font-semibold text-blue-600">
                        {formatPercentage(result.percentage)}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-6 py-4">
                      <span className="font-semibold text-emerald-600">
                        {result.correctAnswers}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-6 py-4">
                      <span className="font-semibold text-red-600">
                        {result.wrongAnswers}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-6 py-4">
                      <span className="font-semibold text-slate-600">
                        {result.unanswered}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                      {formatDuration(result.timeUsedSeconds)}
                    </td>

                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                      {formatDate(result.completedAt)}
                    </td>

                    <td className="whitespace-nowrap px-6 py-4">
                      <Link
                        href={`/admin/results/${result.id}`}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}

                {results.length === 0 && (
                  <tr>
                    <td
                      colSpan={11}
                      className="px-6 py-12 text-center text-sm text-slate-500"
                    >
                      No results found matching the selected
                      filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}