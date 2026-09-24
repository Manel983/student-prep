import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import CancelExamButton from "./CancelExamButton";

interface AdminExamsPageProps {
  searchParams: Promise<{
    search?: string;
    subjectId?: string;
    status?: string;
    page?: string;
  }>;
}

const PAGE_SIZE = 20;

const statusLabels: Record<string, string> = {
  NOT_STARTED: "Not Started",
  IN_PROGRESS: "In Progress",
  SUBMITTED: "Submitted",
  AUTO_SUBMITTED: "Auto Submitted",
  MARKED: "Marked",
};

const statusStyles: Record<string, string> = {
  NOT_STARTED: "bg-slate-100 text-slate-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  SUBMITTED: "bg-amber-100 text-amber-700",
  AUTO_SUBMITTED: "bg-red-100 text-red-700",
  MARKED: "bg-green-100 text-green-700",
};

function examTypeLabel(title: string) {
  const normalizedTitle = title.toLowerCase();

  if (normalizedTitle.includes("bece")) {
    return "BECE";
  }

  if (normalizedTitle.includes("likely")) {
    return "Likely";
  }

  if (
    normalizedTitle.includes("topic") ||
    normalizedTitle.includes("topic-based")
  ) {
    return "Topic-Based";
  }

  return "Exam";
}

function formatDuration(minutes: number) {
  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours} hr`;
  }

  return `${hours} hr ${remainingMinutes} min`;
}

function formatDate(date: Date) {
  return date.toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function buildPageUrl(
  search: string,
  subjectId: string,
  status: string,
  page: number
) {
  const params = new URLSearchParams();

  if (search) {
    params.set("search", search);
  }

  if (subjectId) {
    params.set("subjectId", subjectId);
  }

  if (status) {
    params.set("status", status);
  }

  if (page > 1) {
    params.set("page", String(page));
  }

  const query = params.toString();

  return query
    ? `/admin/exams?${query}`
    : "/admin/exams";
}

export default async function AdminExamsPage({
  searchParams,
}: AdminExamsPageProps) {
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

  if (
    !admin ||
    !admin.isActive ||
    admin.role !== "ADMIN"
  ) {
    redirect("/dashboard");
  }

  const params = await searchParams;

  const search = params.search?.trim() || "";
  const subjectId = params.subjectId || "";
  const status = params.status || "";

  const parsedPage = Number(params.page || "1");

  const currentPage =
    Number.isFinite(parsedPage) && parsedPage > 0
      ? Math.floor(parsedPage)
      : 1;

  const where = {
    ...(search
      ? {
          OR: [
            {
              title: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
            {
              user: {
                OR: [
                  {
                    firstName: {
                      contains: search,
                      mode: "insensitive" as const,
                    },
                  },
                  {
                    lastName: {
                      contains: search,
                      mode: "insensitive" as const,
                    },
                  },
                  {
                    email: {
                      contains: search,
                      mode: "insensitive" as const,
                    },
                  },
                ],
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
    ...(status
      ? {
          status: status as
            | "NOT_STARTED"
            | "IN_PROGRESS"
            | "SUBMITTED"
            | "AUTO_SUBMITTED"
            | "MARKED",
        }
      : {}),
  };

  const [
    totalExams,
    notStartedCount,
    inProgressCount,
    submittedCount,
    autoSubmittedCount,
    markedCount,
    totalFilteredExams,
    subjects,
  ] = await Promise.all([
    prisma.exam.count(),

    prisma.exam.count({
      where: {
        status: "NOT_STARTED",
      },
    }),

    prisma.exam.count({
      where: {
        status: "IN_PROGRESS",
      },
    }),

    prisma.exam.count({
      where: {
        status: "SUBMITTED",
      },
    }),

    prisma.exam.count({
      where: {
        status: "AUTO_SUBMITTED",
      },
    }),

    prisma.exam.count({
      where: {
        status: "MARKED",
      },
    }),

    prisma.exam.count({
      where,
    }),

    prisma.subject.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    }),
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(totalFilteredExams / PAGE_SIZE)
  );

  const safePage = Math.min(
    currentPage,
    totalPages
  );

  const skip = (safePage - 1) * PAGE_SIZE;

  const exams = await prisma.exam.findMany({
    where,
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
          id: true,
          score: true,
          totalMarks: true,
          percentage: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    skip,
    take: PAGE_SIZE,
  });

  const firstItem =
    totalFilteredExams === 0
      ? 0
      : skip + 1;

  const lastItem = Math.min(
    skip + exams.length,
    totalFilteredExams
  );

  const hasFilters =
    Boolean(search) ||
    Boolean(subjectId) ||
    Boolean(status);

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Link
                href="/admin"
                className="text-sm font-semibold text-blue-600 hover:text-blue-700"
              >
                ← Back to Admin Dashboard
              </Link>

              <h1 className="mt-3 text-2xl font-bold text-slate-900 sm:text-3xl">
                Exam Management
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Monitor student examinations, statuses,
                results, and activity.
              </p>
            </div>

            <Link
              href="/admin/questions"
              className="inline-flex w-fit items-center rounded-lg border border-blue-200 bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
            >
              Manage Questions
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Overview */}
        <section>
          <div className="mb-5">
            <div className="flex items-center gap-3">
              <div className="h-8 w-1 rounded-full bg-blue-600" />

              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Examination Overview
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Current examination activity across
                  the platform.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-slate-500">
                Total
              </p>

              <p className="mt-2 text-3xl font-bold text-slate-900">
                {totalExams.toLocaleString()}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-slate-500">
                Not Started
              </p>

              <p className="mt-2 text-3xl font-bold text-slate-700">
                {notStartedCount.toLocaleString()}
              </p>
            </div>

            <div className="rounded-2xl border border-blue-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-blue-600">
                In Progress
              </p>

              <p className="mt-2 text-3xl font-bold text-blue-700">
                {inProgressCount.toLocaleString()}
              </p>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-amber-600">
                Submitted
              </p>

              <p className="mt-2 text-3xl font-bold text-amber-700">
                {submittedCount.toLocaleString()}
              </p>
            </div>

            <div className="rounded-2xl border border-red-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-red-600">
                Auto Submitted
              </p>

              <p className="mt-2 text-3xl font-bold text-red-700">
                {autoSubmittedCount.toLocaleString()}
              </p>
            </div>

            <div className="rounded-2xl border border-green-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-green-600">
                Marked
              </p>

              <p className="mt-2 text-3xl font-bold text-green-700">
                {markedCount.toLocaleString()}
              </p>
            </div>
          </div>
        </section>

        {/* Filters */}
        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-bold text-slate-900">
              Filter Examinations
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Search by student, email, or examination
              title.
            </p>
          </div>

          <form
            method="GET"
            className="grid gap-4 md:grid-cols-4"
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
                type="text"
                defaultValue={search}
                placeholder="Student or exam..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">
                  All Subjects
                </option>

                {subjects.map((subject) => (
                  <option
                    key={subject.id}
                    value={subject.id}
                  >
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="status"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Status
              </label>

              <select
                id="status"
                name="status"
                defaultValue={status}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">
                  All Statuses
                </option>

                <option value="NOT_STARTED">
                  Not Started
                </option>

                <option value="IN_PROGRESS">
                  In Progress
                </option>

                <option value="SUBMITTED">
                  Submitted
                </option>

                <option value="AUTO_SUBMITTED">
                  Auto Submitted
                </option>

                <option value="MARKED">
                  Marked
                </option>
              </select>
            </div>

            <div className="flex items-end gap-2">
              <button
                type="submit"
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Apply Filters
              </button>

              {hasFilters && (
                <Link
                  href="/admin/exams"
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Clear
                </Link>
              )}
            </div>
          </form>
        </section>

        {/* Results */}
        <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Examinations
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {totalFilteredExams === 0
                    ? "No examinations found."
                    : `Showing ${firstItem}-${lastItem} of ${totalFilteredExams.toLocaleString()} examinations.`}
                </p>
              </div>

              <Link
                href="/admin/results"
                className="text-sm font-semibold text-blue-600 hover:text-blue-700"
              >
                View Results →
              </Link>
            </div>
          </div>

          {exams.length === 0 ? (
            <div className="p-10 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-2xl">
                📝
              </div>

              <h3 className="mt-4 text-lg font-bold text-slate-900">
                No examinations found
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Try changing your search or filter
                settings.
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full text-left">
                  <thead className="border-b border-slate-200 bg-slate-50">
                    <tr>
                      <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                        Student
                      </th>

                      <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                        Exam
                      </th>

                      <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                        Type
                      </th>

                      <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                        Subject
                      </th>

                      <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                        Questions
                      </th>

                      <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                        Duration
                      </th>

                      <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                        Status
                      </th>

                      <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                        Result
                      </th>

                      <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                        Created
                      </th>

                      <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {exams.map((exam) => (
                      <tr
                        key={exam.id}
                        className="transition hover:bg-slate-50"
                      >
                        <td className="px-5 py-4">
                          <p className="font-semibold text-slate-900">
                            {exam.user.firstName}{" "}
                            {exam.user.lastName}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {exam.user.email}
                          </p>
                        </td>

                        <td className="max-w-xs px-5 py-4">
                          <p className="font-semibold text-slate-900">
                            {exam.title}
                          </p>

                          <p className="mt-1 break-all text-xs text-slate-400">
                            {exam.id}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                            {examTypeLabel(
                              exam.title
                            )}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span className="text-sm font-medium text-slate-700">
                            {exam.subject.name}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span className="text-sm font-semibold text-slate-900">
                            {exam.totalQuestions}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span className="text-sm text-slate-700">
                            {formatDuration(
                              exam.durationMinutes
                            )}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                              statusStyles[
                                exam.status
                              ] ||
                              "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {statusLabels[
                              exam.status
                            ] || exam.status}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          {exam.result ? (
                            <div>
                              <p className="font-semibold text-slate-900">
                                {exam.result.score}/
                                {
                                  exam.result
                                    .totalMarks
                                }
                              </p>

                              <p className="mt-1 text-xs font-semibold text-blue-600">
                                {Number(
                                  exam.result
                                    .percentage
                                ).toFixed(2)}
                                %
                              </p>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">
                              No result
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <span className="text-xs text-slate-500">
                            {formatDate(
                              exam.createdAt
                            )}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex flex-wrap gap-2">
                            <Link
                              href={`/admin/exams/${exam.id}`}
                              className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-50"
                            >
                              View
                            </Link>

                            {(exam.status ===
                              "NOT_STARTED" ||
                              exam.status ===
                                "IN_PROGRESS") && (
                              <CancelExamButton
                                id={exam.id}
                                status={exam.status}
                              />
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="divide-y divide-slate-100 lg:hidden">
                {exams.map((exam) => (
                  <article
                    key={exam.id}
                    className="p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h3 className="font-bold text-slate-900">
                          {exam.title}
                        </h3>

                        <p className="mt-1 text-sm text-slate-500">
                          {exam.subject.name}
                        </p>
                      </div>

                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                          statusStyles[
                            exam.status
                          ] ||
                          "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {statusLabels[
                          exam.status
                        ] || exam.status}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-lg bg-slate-50 p-3">
                        <p className="text-xs text-slate-500">
                          Student
                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          {exam.user.firstName}{" "}
                          {exam.user.lastName}
                        </p>
                      </div>

                      <div className="rounded-lg bg-slate-50 p-3">
                        <p className="text-xs text-slate-500">
                          Exam Type
                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          {examTypeLabel(
                            exam.title
                          )}
                        </p>
                      </div>

                      <div className="rounded-lg bg-slate-50 p-3">
                        <p className="text-xs text-slate-500">
                          Questions
                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          {exam.totalQuestions}
                        </p>
                      </div>

                      <div className="rounded-lg bg-slate-50 p-3">
                        <p className="text-xs text-slate-500">
                          Duration
                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          {formatDuration(
                            exam.durationMinutes
                          )}
                        </p>
                      </div>

                      <div className="rounded-lg bg-slate-50 p-3">
                        <p className="text-xs text-slate-500">
                          Result
                        </p>

                        {exam.result ? (
                          <p className="mt-1 text-sm font-semibold text-slate-900">
                            {exam.result.score}/
                            {
                              exam.result
                                .totalMarks
                            }{" "}
                            (
                            {Number(
                              exam.result
                                .percentage
                            ).toFixed(2)}
                            %)
                          </p>
                        ) : (
                          <p className="mt-1 text-sm text-slate-400">
                            No result
                          </p>
                        )}
                      </div>

                      <div className="rounded-lg bg-slate-50 p-3">
                        <p className="text-xs text-slate-500">
                          Created
                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          {formatDate(
                            exam.createdAt
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <Link
                        href={`/admin/exams/${exam.id}`}
                        className="rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
                      >
                        View Examination
                      </Link>

                      {(exam.status ===
                        "NOT_STARTED" ||
                        exam.status ===
                          "IN_PROGRESS") && (
                        <CancelExamButton
                          id={exam.id}
                          status={exam.status}
                        />
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col gap-4 border-t border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">
                Page{" "}
                <strong className="text-slate-900">
                  {safePage}
                </strong>{" "}
                of{" "}
                <strong className="text-slate-900">
                  {totalPages}
                </strong>
              </p>

              <div className="flex items-center gap-2">
                {safePage > 1 ? (
                  <Link
                    href={buildPageUrl(
                      search,
                      subjectId,
                      status,
                      safePage - 1
                    )}
                    className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    ← Previous
                  </Link>
                ) : (
                  <span className="cursor-not-allowed rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-400">
                    ← Previous
                  </span>
                )}

                {safePage < totalPages ? (
                  <Link
                    href={buildPageUrl(
                      search,
                      subjectId,
                      status,
                      safePage + 1
                    )}
                    className="rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
                  >
                    Next →
                  </Link>
                ) : (
                  <span className="cursor-not-allowed rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-400">
                    Next →
                  </span>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Navigation */}
        <section className="mt-8">
          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin"
              className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Back to Admin Dashboard
            </Link>

            <Link
              href="/admin/results"
              className="rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Manage Results
            </Link>

            <Link
              href="/admin/questions"
              className="rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Manage Questions
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}