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

function statusLabel(status: string) {
  switch (status) {
    case "SUBMITTED":
      return "Submitted";

    case "AUTO_SUBMITTED":
      return "Auto Submitted";

    case "IN_PROGRESS":
      return "In Progress";

    case "MARKED":
      return "Marked";

    case "NOT_STARTED":
      return "Not Started";

    default:
      return status;
  }
}

function statusClasses(status: string) {
  switch (status) {
    case "SUBMITTED":
    case "MARKED":
      return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";

    case "AUTO_SUBMITTED":
      return "bg-amber-50 text-amber-700 ring-1 ring-amber-200";

    case "IN_PROGRESS":
      return "bg-blue-50 text-blue-700 ring-1 ring-blue-200";

    case "NOT_STARTED":
      return "bg-slate-100 text-slate-600 ring-1 ring-slate-200";

    default:
      return "bg-slate-100 text-slate-600 ring-1 ring-slate-200";
  }
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

  if (!admin || !admin.isActive || admin.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const params = await searchParams;

  const search = params.search?.trim() || "";
  const subjectId = params.subjectId || "";
  const status = params.status || "";

  const validStatuses = [
    "NOT_STARTED",
    "IN_PROGRESS",
    "SUBMITTED",
    "AUTO_SUBMITTED",
    "MARKED",
  ];

  const [exams, subjects] = await Promise.all([
    prisma.exam.findMany({
      where: {
        ...(search
          ? {
              OR: [
                {
                  title: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
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
              ],
            }
          : {}),

        ...(subjectId
          ? {
              subjectId,
            }
          : {}),

        ...(status && validStatuses.includes(status)
          ? {
              status: status as
                | "NOT_STARTED"
                | "IN_PROGRESS"
                | "SUBMITTED"
                | "AUTO_SUBMITTED"
                | "MARKED",
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
            correctAnswers: true,
            wrongAnswers: true,
            unanswered: true,
            timeUsedSeconds: true,
            completedAt: true,
          },
        },
      },

      orderBy: {
        createdAt: "desc",
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
              Exams
            </h1>

            <p className="mt-2 text-slate-600">
              View and monitor student examination activity.
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
            Filter Exams
          </h2>

          <form
            method="GET"
            className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-4"
          >
            <div className="lg:col-span-2">
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
                placeholder="Search title, student name or email..."
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
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Status
              </label>

              <select
                id="status"
                name="status"
                defaultValue={status}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">All Statuses</option>

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

            <div className="flex flex-col gap-3 md:col-span-2 lg:col-span-4 sm:flex-row">
              <button
                type="submit"
                className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Apply Filters
              </button>

              {(search || subjectId || status) && (
                <Link
                  href="/admin/exams"
                  className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Clear Filters
                </Link>
              )}
            </div>
          </form>
        </section>

        {/* Count */}
        <div className="mb-4">
          <p className="text-sm text-slate-600">
            Showing{" "}
            <span className="font-semibold text-slate-900">
              {exams.length}
            </span>{" "}
            {exams.length === 1 ? "exam" : "exams"}.
          </p>
        </div>

        {/* Exams Table */}
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
                    Questions
                  </th>

                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    Duration
                  </th>

                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    Status
                  </th>

                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    Result
                  </th>

                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    Created
                  </th>

                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {exams.map((exam) => (
                  <tr
                    key={exam.id}
                    className="hover:bg-slate-50"
                  >
                    <td className="px-6 py-4">
                      <p className="whitespace-nowrap font-medium text-slate-900">
                        {exam.user.firstName}{" "}
                        {exam.user.lastName}
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        {exam.user.email}
                      </p>
                    </td>

                    <td className="max-w-xs px-6 py-4">
                      <p className="font-medium text-slate-900">
                        {exam.title}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        ID: {exam.id}
                      </p>
                    </td>

                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                      {exam.subject.name}
                    </td>

                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                      {exam.totalQuestions}
                    </td>

                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                      {exam.durationMinutes} min
                    </td>

                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${statusClasses(
                          exam.status
                        )}`}
                      >
                        {statusLabel(exam.status)}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-6 py-4">
                      {exam.result ? (
                        <div>
                          <p className="font-semibold text-slate-900">
                            {exam.result.score}/
                            {exam.result.totalMarks}
                          </p>

                          <p className="mt-1 text-sm text-blue-600">
                            {formatPercentage(
                              exam.result.percentage
                            )}
                          </p>
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400">
                          No result
                        </span>
                      )}
                    </td>

                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                      {formatDate(exam.createdAt)}
                    </td>

                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/admin/exams/${exam.id}`}
                          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                        >
                          View
                        </Link>

                        <CancelExamButton
                          id={exam.id}
                          status={exam.status}
                        />
                      </div>
                    </td>
                  </tr>
                ))}

                {exams.length === 0 && (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-6 py-12 text-center text-sm text-slate-500"
                    >
                      No exams found matching the
                      selected filters.
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