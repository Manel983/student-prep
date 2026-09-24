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

function getPercentageValue(
  value: string | number | null | undefined | { toString(): string }
) {
  if (value === null || value === undefined) {
    return 0;
  }

  return Number(value.toString());
}

function getPercentageClasses(percentage: number) {
  if (percentage >= 60) {
    return "border-green-200 bg-green-50 text-green-700";
  }

  if (percentage >= 40) {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  return "border-red-200 bg-red-50 text-red-700";
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

  const averagePercentage =
    results.length > 0
      ? results.reduce(
          (total, result) =>
            total + getPercentageValue(result.percentage),
          0
        ) / results.length
      : 0;

  const passedResults = results.filter(
    (result) => getPercentageValue(result.percentage) >= 50
  ).length;

  const resultsWithMistakes = results.filter(
    (result) => result.wrongAnswers > 0
  ).length;

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex items-center gap-4">
            <img
              src="/logo.jpg"
              alt="Student Prep"
              className="h-11 w-auto object-contain"
            />

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900">
                  Results
                </h1>

                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                  Admin
                </span>
              </div>

              <p className="mt-1 text-sm text-slate-500">
                Monitor student examination performance and results.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/exams"
              className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Exams
            </Link>

            <Link
              href="/admin"
              className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Admin Dashboard
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Overview */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Results Found
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {results.length}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Matching current filters
            </p>
          </div>

          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
            <p className="text-sm font-medium text-blue-700">
              Average Score
            </p>

            <p className="mt-2 text-3xl font-bold text-blue-700">
              {averagePercentage.toFixed(1)}%
            </p>

            <p className="mt-1 text-xs text-blue-600">
              Across displayed results
            </p>
          </div>

          <div className="rounded-2xl border border-green-200 bg-green-50 p-5 shadow-sm">
            <p className="text-sm font-medium text-green-700">
              50%+ Results
            </p>

            <p className="mt-2 text-3xl font-bold text-green-700">
              {passedResults}
            </p>

            <p className="mt-1 text-xs text-green-600">
              Results at or above 50%
            </p>
          </div>

          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm">
            <p className="text-sm font-medium text-red-700">
              With Wrong Answers
            </p>

            <p className="mt-2 text-3xl font-bold text-red-700">
              {resultsWithMistakes}
            </p>

            <p className="mt-1 text-xs text-red-600">
              Results requiring review
            </p>
          </div>
        </section>

        {/* Filters */}
        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-bold text-slate-900">
              Search & Filter Results
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Find results by student, email, exam, or subject.
            </p>
          </div>

          <form
            method="GET"
            className="grid gap-4 md:grid-cols-[1fr_220px_auto_auto]"
          >
            <div>
              <label
                htmlFor="search"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Search
              </label>

              <input
                id="search"
                name="search"
                defaultValue={search}
                placeholder="Student, email, or exam..."
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">All subjects</option>

                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="w-full rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 md:w-auto"
              >
                Apply Filters
              </button>
            </div>

            <div className="flex items-end">
              <Link
                href="/admin/results"
                className="w-full rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50 md:w-auto"
              >
                Clear
              </Link>
            </div>
          </form>
        </section>

        {/* Result Count */}
        <div className="mt-8 mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-slate-600">
              Showing{" "}
              <span className="font-semibold text-slate-900">
                {results.length}
              </span>{" "}
              {results.length === 1 ? "result" : "results"}.
            </p>
          </div>

          {(search || subjectId) && (
            <div className="flex flex-wrap gap-2 text-xs">
              {search && (
                <span className="rounded-full bg-blue-100 px-3 py-1.5 font-medium text-blue-700">
                  Search: {search}
                </span>
              )}

              {subjectId && (
                <span className="rounded-full bg-green-100 px-3 py-1.5 font-medium text-green-700">
                  Subject filter active
                </span>
              )}
            </div>
          )}
        </div>

        {/* Results Table */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
            <h2 className="font-bold text-slate-900">
              Student Results
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Detailed examination performance records.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="border-b border-slate-200 bg-white">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Student
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Exam
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Subject
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Score
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Percentage
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Correct
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Wrong
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Unanswered
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Time
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Completed
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {results.map((result) => {
                  const percentage = getPercentageValue(
                    result.percentage
                  );

                  const percentageClasses =
                    getPercentageClasses(percentage);

                  return (
                    <tr
                      key={result.id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                            {result.user.firstName
                              .charAt(0)
                              .toUpperCase()}
                            {result.user.lastName
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div>
                            <p className="whitespace-nowrap font-semibold text-slate-900">
                              {result.user.firstName}{" "}
                              {result.user.lastName}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {result.user.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="max-w-xs px-6 py-4">
                        <p className="font-medium text-slate-900">
                          {result.exam.title}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          ID: {result.exam.id}
                        </p>
                      </td>

                      <td className="whitespace-nowrap px-6 py-4">
                        <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                          {result.exam.subject.name}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-6 py-4">
                        <span className="font-bold text-slate-900">
                          {result.score}/{result.totalMarks}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-6 py-4">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-bold ${percentageClasses}`}
                        >
                          {formatPercentage(result.percentage)}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-6 py-4">
                        <span className="inline-flex rounded-full bg-green-100 px-3 py-1.5 text-xs font-bold text-green-700">
                          {result.correctAnswers}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-6 py-4">
                        <span className="inline-flex rounded-full bg-red-100 px-3 py-1.5 text-xs font-bold text-red-700">
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
                          className="inline-flex rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })}

                {results.length === 0 && (
                  <tr>
                    <td
                      colSpan={11}
                      className="px-6 py-16 text-center"
                    >
                      <div className="mx-auto max-w-md">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-xl">
                          —
                        </div>

                        <h3 className="mt-4 text-lg font-bold text-slate-900">
                          No results found
                        </h3>

                        <p className="mt-2 text-sm text-slate-500">
                          No examination results match the selected
                          filters. Try changing your search or subject
                          filter.
                        </p>

                        <Link
                          href="/admin/results"
                          className="mt-5 inline-flex rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                        >
                          Clear Filters
                        </Link>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Legend */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center gap-5 text-sm">
            <span className="font-semibold text-slate-700">
              Performance:
            </span>

            <span className="flex items-center gap-2 text-green-700">
              <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
              60% and above
            </span>

            <span className="flex items-center gap-2 text-blue-700">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
              40%–59.9%
            </span>

            <span className="flex items-center gap-2 text-red-700">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
              Below 40%
            </span>
          </div>
        </section>

        {/* Navigation */}
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/admin"
            className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Admin Dashboard
          </Link>

          <Link
            href="/admin/exams"
            className="rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Manage Exams
          </Link>

          <Link
            href="/admin/students"
            className="rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Students
          </Link>
        </div>
      </div>
    </main>
  );
}
