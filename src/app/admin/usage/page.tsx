import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export default async function AdminUsagePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const [
    totalStudents,
    activeStudents,
    inactiveStudents,
    totalExams,
    inProgressExams,
    submittedExams,
    autoSubmittedExams,
    markedExams,
    totalResults,
    answerStats,
    averageScore,
    subjectUsage,
  ] = await Promise.all([
    prisma.user.count({
      where: {
        role: "STUDENT",
      },
    }),

    prisma.user.count({
      where: {
        role: "STUDENT",
        isActive: true,
      },
    }),

    prisma.user.count({
      where: {
        role: "STUDENT",
        isActive: false,
      },
    }),

    prisma.exam.count(),

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

    prisma.result.count(),

    prisma.studentAnswer.groupBy({
      by: ["isCorrect"],
      _count: {
        _all: true,
      },
    }),

    prisma.result.aggregate({
      _avg: {
        percentage: true,
      },
    }),

    prisma.exam.groupBy({
      by: ["subjectId"],
      _count: {
        _all: true,
      },
      orderBy: {
        _count: {
          subjectId: "desc",
        },
      },
    }),
  ]);

  const correctAnswers =
    answerStats.find((item) => item.isCorrect === true)?._count
      ._all ?? 0;

  const wrongAnswers =
    answerStats.find((item) => item.isCorrect === false)?._count
      ._all ?? 0;

  const unanswered =
    answerStats.find((item) => item.isCorrect === null)?._count
      ._all ?? 0;

  const subjectIds = subjectUsage.map(
    (subject) => subject.subjectId
  );

  const subjects =
    subjectIds.length > 0
      ? await prisma.subject.findMany({
          where: {
            id: {
              in: subjectIds,
            },
          },
          select: {
            id: true,
            name: true,
          },
          orderBy: {
            name: "asc",
          },
        })
      : [];

  const subjectNameMap = new Map(
    subjects.map((subject) => [
      subject.id,
      subject.name,
    ])
  );

  const subjectUsageData = subjectUsage.map((item) => ({
    subjectId: item.subjectId,
    subjectName:
      subjectNameMap.get(item.subjectId) ??
      "Unknown Subject",
    exams: item._count._all,
  }));

  const averagePercentage = Number(
    averageScore._avg.percentage ?? 0
  );

  const totalAttempts =
    correctAnswers + wrongAnswers + unanswered;

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
          <div>
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 transition hover:text-blue-700"
            >
              <span aria-hidden="true">←</span>
              Back to Admin Dashboard
            </Link>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Exam & Student Usage
              </h1>

              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                Admin Monitoring
              </span>
            </div>

            <p className="mt-1 text-sm text-slate-500">
              Read-only overview of student activity and
              examination usage.
            </p>
          </div>

          <div className="hidden sm:flex">
            <img
              src="/logo.jpg"
              alt="Student Prep"
              className="h-11 w-auto object-contain"
            />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Monitoring Banner */}
        <section className="rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-800">
                Usage Monitoring
              </p>

              <p className="mt-1 text-sm text-blue-700">
                This page provides a read-only view of platform
                activity, exam progress, answers, and subject usage.
              </p>
            </div>

            <span className="inline-flex w-fit items-center rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 shadow-sm">
              Read Only
            </span>
          </div>
        </section>

        {/* Student Overview */}
        <section className="mt-8">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Student Overview
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Current student account activity.
            </p>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-slate-500">
                Total Students
              </p>

              <p className="mt-2 text-3xl font-bold text-slate-900">
                {totalStudents}
              </p>

              <p className="mt-2 text-xs text-slate-500">
                All registered student accounts
              </p>
            </div>

            <div className="rounded-2xl border border-green-200 bg-green-50 p-5 shadow-sm">
              <p className="text-sm font-medium text-green-700">
                Active Students
              </p>

              <p className="mt-2 text-3xl font-bold text-green-700">
                {activeStudents}
              </p>

              <p className="mt-2 text-xs text-green-700">
                Accounts currently enabled
              </p>
            </div>

            <div className="rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm">
              <p className="text-sm font-medium text-red-700">
                Inactive Students
              </p>

              <p className="mt-2 text-3xl font-bold text-red-700">
                {inactiveStudents}
              </p>

              <p className="mt-2 text-xs text-red-700">
                Accounts currently disabled
              </p>
            </div>
          </div>
        </section>

        {/* Exam Overview */}
        <section className="mt-8">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Exam Overview
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Current examination activity and completion states.
            </p>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-slate-500">
                Total Exams
              </p>

              <p className="mt-2 text-3xl font-bold text-slate-900">
                {totalExams}
              </p>
            </div>

            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
              <p className="text-sm font-medium text-blue-700">
                In Progress
              </p>

              <p className="mt-2 text-3xl font-bold text-blue-700">
                {inProgressExams}
              </p>
            </div>

            <div className="rounded-2xl border border-green-200 bg-green-50 p-5 shadow-sm">
              <p className="text-sm font-medium text-green-700">
                Submitted
              </p>

              <p className="mt-2 text-3xl font-bold text-green-700">
                {submittedExams}
              </p>
            </div>

            <div className="rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm">
              <p className="text-sm font-medium text-red-700">
                Auto-Submitted
              </p>

              <p className="mt-2 text-3xl font-bold text-red-700">
                {autoSubmittedExams}
              </p>
            </div>

            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
              <p className="text-sm font-medium text-blue-700">
                Marked
              </p>

              <p className="mt-2 text-3xl font-bold text-blue-700">
                {markedExams}
              </p>
            </div>
          </div>
        </section>

        {/* Performance */}
        <section className="mt-8">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Examination Performance
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Overall result and answer performance.
            </p>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-slate-500">
                Total Results
              </p>

              <p className="mt-2 text-3xl font-bold text-slate-900">
                {totalResults}
              </p>
            </div>

            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
              <p className="text-sm font-medium text-blue-700">
                Average Score
              </p>

              <p className="mt-2 text-3xl font-bold text-blue-700">
                {averagePercentage.toFixed(2)}%
              </p>
            </div>

            <div className="rounded-2xl border border-green-200 bg-green-50 p-5 shadow-sm">
              <p className="text-sm font-medium text-green-700">
                Correct Answers
              </p>

              <p className="mt-2 text-3xl font-bold text-green-700">
                {correctAnswers}
              </p>
            </div>

            <div className="rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm">
              <p className="text-sm font-medium text-red-700">
                Wrong Answers
              </p>

              <p className="mt-2 text-3xl font-bold text-red-700">
                {wrongAnswers}
              </p>
            </div>
          </div>
        </section>

        {/* Answer Statistics */}
        <section className="mt-8">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Answer Activity
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Breakdown of recorded student answers.
              </p>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-green-200 bg-green-50 p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-green-700">
                    Correct
                  </p>

                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-green-700">
                    Success
                  </span>
                </div>

                <p className="mt-3 text-2xl font-bold text-green-800">
                  {correctAnswers}
                </p>
              </div>

              <div className="rounded-xl border border-red-200 bg-red-50 p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-red-700">
                    Wrong
                  </p>

                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-red-700">
                    Review
                  </span>
                </div>

                <p className="mt-3 text-2xl font-bold text-red-800">
                  {wrongAnswers}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-600">
                    Unanswered
                  </p>

                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-600">
                    Neutral
                  </span>
                </div>

                <p className="mt-3 text-2xl font-bold text-slate-700">
                  {unanswered}
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">
                    Total recorded attempts
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Combined correct, wrong, and unanswered responses.
                  </p>
                </div>

                <span className="text-2xl font-bold text-slate-900">
                  {totalAttempts}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Subject Usage */}
        <section className="mt-8">
          <div className="mb-5">
            <h2 className="text-xl font-bold text-slate-900">
              Exam Usage by Subject
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Number of exams created for each subject.
            </p>
          </div>

          {subjectUsageData.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-lg font-bold text-blue-600">
                —
              </div>

              <p className="mt-4 font-semibold text-slate-900">
                No exam activity yet.
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Subject usage will appear here once students
                begin taking exams.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-semibold text-slate-700">
                    Subject Activity
                  </p>

                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                    {subjectUsageData.length} subject
                    {subjectUsageData.length === 1 ? "" : "s"}
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-white">
                    <tr>
                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Subject
                      </th>

                      <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Exams
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-200">
                    {subjectUsageData.map((subject) => (
                      <tr
                        key={subject.subjectId}
                        className="transition hover:bg-slate-50"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-xs font-bold text-blue-700">
                              {subject.subjectName
                                .slice(0, 2)
                                .toUpperCase()}
                            </span>

                            <span className="font-semibold text-slate-900">
                              {subject.subjectName}
                            </span>
                          </div>
                        </td>

                        <td className="px-5 py-4 text-right">
                          <span className="inline-flex min-w-12 justify-center rounded-full bg-blue-50 px-3 py-1.5 text-sm font-bold text-blue-700">
                            {subject.exams}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        {/* Navigation */}
        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="font-bold text-slate-900">
              Usage Management
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Continue to the related administration sections.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin"
              className="rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
            >
              Back to Admin Dashboard
            </Link>

            <Link
              href="/admin/exams"
              className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Manage Exams
            </Link>

            <Link
              href="/admin/results"
              className="rounded-lg bg-green-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-700"
            >
              Manage Results
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}