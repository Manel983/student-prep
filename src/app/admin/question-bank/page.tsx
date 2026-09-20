import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export default async function AdminQuestionBankPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const [
    totalQuestions,
    publishedQuestions,
    draftQuestions,
    archivedQuestions,
    easyQuestions,
    mediumQuestions,
    hardQuestions,
    totalMarks,
    subjects,
  ] = await Promise.all([
    prisma.question.count(),

    prisma.question.count({
      where: {
        status: "PUBLISHED",
      },
    }),

    prisma.question.count({
      where: {
        status: "DRAFT",
      },
    }),

    prisma.question.count({
      where: {
        status: "ARCHIVED",
      },
    }),

    prisma.question.count({
      where: {
        difficulty: "EASY",
      },
    }),

    prisma.question.count({
      where: {
        difficulty: "MEDIUM",
      },
    }),

    prisma.question.count({
      where: {
        difficulty: "HARD",
      },
    }),

    prisma.question.aggregate({
      _sum: {
        marks: true,
      },
      where: {
        status: "PUBLISHED",
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
        _count: {
          select: {
            questions: true,
          },
        },
      },
    }),
  ]);

  const publishedBySubject = await Promise.all(
    subjects.map(async (subject) => {
      const published = await prisma.question.count({
        where: {
          subjectId: subject.id,
          status: "PUBLISHED",
        },
      });

      const draft = await prisma.question.count({
        where: {
          subjectId: subject.id,
          status: "DRAFT",
        },
      });

      const archived = await prisma.question.count({
        where: {
          subjectId: subject.id,
          status: "ARCHIVED",
        },
      });

      return {
        id: subject.id,
        name: subject.name,
        isActive: subject.isActive,
        total: subject._count.questions,
        published,
        draft,
        archived,
      };
    })
  );

  const subjectsWithoutPublishedQuestions =
    publishedBySubject.filter(
      (subject) => subject.published === 0
    );

  const subjectsWithLowQuestionCount =
    publishedBySubject.filter(
      (subject) =>
        subject.published > 0 && subject.published < 10
    );

  const publishedMarks = totalMarks._sum.marks ?? 0;

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
          <div>
            <Link
              href="/admin"
              className="text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              ← Back to Admin Dashboard
            </Link>

            <h1 className="mt-3 text-2xl font-bold text-slate-900">
              Question Bank Statistics
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Read-only monitoring of questions, difficulty,
              subjects, and publication status.
            </p>
          </div>

          <Link
            href="/admin/questions"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Manage Questions
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Overview */}
        <section>
          <h2 className="text-xl font-bold text-slate-900">
            Question Overview
          </h2>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-slate-500">
                Total Questions
              </p>

              <p className="mt-2 text-3xl font-bold text-slate-900">
                {totalQuestions}
              </p>
            </div>

            <div className="rounded-2xl border border-green-200 bg-green-50 p-5 shadow-sm">
              <p className="text-sm font-medium text-green-700">
                Published
              </p>

              <p className="mt-2 text-3xl font-bold text-green-700">
                {publishedQuestions}
              </p>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
              <p className="text-sm font-medium text-amber-700">
                Draft
              </p>

              <p className="mt-2 text-3xl font-bold text-amber-700">
                {draftQuestions}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-100 p-5 shadow-sm">
              <p className="text-sm font-medium text-slate-600">
                Archived
              </p>

              <p className="mt-2 text-3xl font-bold text-slate-600">
                {archivedQuestions}
              </p>
            </div>
          </div>
        </section>

        {/* Difficulty */}
        <section className="mt-8">
          <h2 className="text-xl font-bold text-slate-900">
            Difficulty Distribution
          </h2>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-green-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-green-700">
                Easy
              </p>

              <p className="mt-2 text-3xl font-bold text-slate-900">
                {easyQuestions}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Questions marked as Easy
              </p>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-amber-700">
                Medium
              </p>

              <p className="mt-2 text-3xl font-bold text-slate-900">
                {mediumQuestions}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Questions marked as Medium
              </p>
            </div>

            <div className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-red-700">
                Hard
              </p>

              <p className="mt-2 text-3xl font-bold text-slate-900">
                {hardQuestions}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Questions marked as Hard
              </p>
            </div>
          </div>
        </section>

        {/* Published Marks */}
        <section className="mt-8">
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6">
            <p className="text-sm font-semibold text-blue-700">
              Published Question Marks
            </p>

            <p className="mt-2 text-3xl font-bold text-blue-900">
              {publishedMarks}
            </p>

            <p className="mt-1 text-sm text-blue-700">
              Total marks available from currently published
              questions.
            </p>
          </div>
        </section>

        {/* Subject Statistics */}
        <section className="mt-8">
          <div className="mb-5">
            <h2 className="text-xl font-bold text-slate-900">
              Questions by Subject
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Review the question-bank size and publication
              status for each subject.
            </p>
          </div>

          {publishedBySubject.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
              <p className="font-semibold text-slate-900">
                No subjects found.
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Create a subject before adding questions.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Subject
                      </th>

                      <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Status
                      </th>

                      <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Total
                      </th>

                      <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Published
                      </th>

                      <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Draft
                      </th>

                      <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Archived
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-200">
                    {publishedBySubject.map((subject) => (
                      <tr key={subject.id}>
                        <td className="px-5 py-4">
                          <p className="font-semibold text-slate-900">
                            {subject.name}
                          </p>
                        </td>

                        <td className="px-5 py-4 text-center">
                          {subject.isActive ? (
                            <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                              Inactive
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-4 text-center font-semibold text-slate-900">
                          {subject.total}
                        </td>

                        <td className="px-5 py-4 text-center font-semibold text-green-600">
                          {subject.published}
                        </td>

                        <td className="px-5 py-4 text-center font-semibold text-amber-600">
                          {subject.draft}
                        </td>

                        <td className="px-5 py-4 text-center font-semibold text-slate-500">
                          {subject.archived}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        {/* Alerts */}
        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
            <h2 className="text-lg font-bold text-red-900">
              Subjects Without Published Questions
            </h2>

            <p className="mt-2 text-sm text-red-700">
              These subjects currently have no published
              questions available for student exams.
            </p>

            <div className="mt-4">
              {subjectsWithoutPublishedQuestions.length === 0 ? (
                <p className="text-sm font-medium text-green-700">
                  All subjects have at least one published
                  question.
                </p>
              ) : (
                <ul className="space-y-2">
                  {subjectsWithoutPublishedQuestions.map(
                    (subject) => (
                      <li
                        key={subject.id}
                        className="rounded-lg bg-white px-4 py-3 text-sm font-medium text-red-800"
                      >
                        {subject.name}
                      </li>
                    )
                  )}
                </ul>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
            <h2 className="text-lg font-bold text-amber-900">
              Low Question Counts
            </h2>

            <p className="mt-2 text-sm text-amber-700">
              These subjects have fewer than 10 published
              questions.
            </p>

            <div className="mt-4">
              {subjectsWithLowQuestionCount.length === 0 ? (
                <p className="text-sm font-medium text-green-700">
                  No subject currently has fewer than 10
                  published questions.
                </p>
              ) : (
                <ul className="space-y-2">
                  {subjectsWithLowQuestionCount.map(
                    (subject) => (
                      <li
                        key={subject.id}
                        className="flex items-center justify-between rounded-lg bg-white px-4 py-3 text-sm"
                      >
                        <span className="font-medium text-amber-800">
                          {subject.name}
                        </span>

                        <span className="font-bold text-amber-900">
                          {subject.published}
                        </span>
                      </li>
                    )
                  )}
                </ul>
              )}
            </div>
          </div>
        </section>

        <div className="mt-8">
          <Link
            href="/admin"
            className="inline-flex rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Back to Admin Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}