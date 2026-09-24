import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

interface ResultsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ResultsPage({
  params,
}: ResultsPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { id } = await params;

  const result = await prisma.result.findFirst({
    where: {
      id,
      userId: session.user.id,
    },
    include: {
      exam: {
        include: {
          subject: {
            select: {
              name: true,
            },
          },
        },
      },
      mistakes: {
        include: {
          question: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  if (!result) {
    redirect("/dashboard");
  }

  const percentage = Number(result.percentage);

  let performanceMessage = "Keep practising!";
  let performanceDescription =
    "Review your mistakes and try another test to improve your score.";

  if (percentage >= 80) {
    performanceMessage = "Excellent work!";
    performanceDescription =
      "You have demonstrated a strong understanding of this subject.";
  } else if (percentage >= 60) {
    performanceMessage = "Good job!";
    performanceDescription =
      "You have a good foundation. Keep practising to improve further.";
  } else if (percentage >= 40) {
    performanceMessage = "Good effort!";
    performanceDescription =
      "You are making progress. Review your mistakes and keep practising.";
  }

  const minutes = result.timeUsedSeconds
    ? Math.floor(result.timeUsedSeconds / 60)
    : 0;

  const seconds = result.timeUsedSeconds
    ? result.timeUsedSeconds % 60
    : 0;

  const performanceTone =
    percentage >= 60
      ? "green"
      : percentage >= 40
        ? "blue"
        : "red";

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 transition hover:text-blue-700"
              >
                <span aria-hidden="true">←</span>
                Back to Dashboard
              </Link>

              <div className="mt-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-lg font-bold text-white">
                  ✓
                </div>

                <div>
                  <h1 className="text-2xl font-bold text-slate-900">
                    Test Results
                  </h1>

                  <p className="mt-1 text-sm text-slate-500">
                    {result.exam.subject.name} · {result.exam.title}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-full bg-green-50 px-4 py-2 text-sm font-semibold text-green-700">
              Test completed
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Main Result Banner */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div
            className={`border-b px-6 py-6 sm:px-8 ${
              performanceTone === "green"
                ? "border-green-200 bg-green-50"
                : performanceTone === "blue"
                  ? "border-blue-200 bg-blue-50"
                  : "border-red-200 bg-red-50"
            }`}
          >
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p
                  className={`text-sm font-bold uppercase tracking-wide ${
                    performanceTone === "green"
                      ? "text-green-700"
                      : performanceTone === "blue"
                        ? "text-blue-700"
                        : "text-red-700"
                  }`}
                >
                  Your performance
                </p>

                <h2 className="mt-2 text-2xl font-bold text-slate-900">
                  {performanceMessage}
                </h2>

                <p className="mt-2 max-w-2xl text-slate-600">
                  {performanceDescription}
                </p>
              </div>

              <div className="flex h-28 w-28 shrink-0 flex-col items-center justify-center rounded-full bg-white shadow-sm ring-8 ring-white/70">
                <span
                  className={`text-3xl font-bold ${
                    performanceTone === "green"
                      ? "text-green-600"
                      : performanceTone === "blue"
                        ? "text-blue-600"
                        : "text-red-600"
                  }`}
                >
                  {percentage}%
                </span>

                <span className="text-xs font-medium text-slate-500">
                  Score
                </span>
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4 sm:p-8">
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-blue-700">
                  Score
                </p>

                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">
                  #
                </span>
              </div>

              <p className="mt-4 text-3xl font-bold text-slate-900">
                {result.score}
                <span className="text-lg font-medium text-slate-500">
                  /{result.totalMarks}
                </span>
              </p>
            </div>

            <div className="rounded-xl border border-green-200 bg-green-50 p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-green-700">
                  Correct
                </p>

                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-600 text-sm font-bold text-white">
                  ✓
                </span>
              </div>

              <p className="mt-4 text-3xl font-bold text-green-700">
                {result.correctAnswers}
              </p>
            </div>

            <div className="rounded-xl border border-red-200 bg-red-50 p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-red-700">
                  Wrong
                </p>

                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-600 text-sm font-bold text-white">
                  !
                </span>
              </div>

              <p className="mt-4 text-3xl font-bold text-red-700">
                {result.wrongAnswers}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-600">
                  Unanswered
                </p>

                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-600 text-sm font-bold text-white">
                  —
                </span>
              </div>

              <p className="mt-4 text-3xl font-bold text-slate-700">
                {result.unanswered}
              </p>
            </div>
          </div>

          {/* Additional Details */}
          <div className="border-t border-slate-200 px-6 py-5 sm:px-8">
            <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm">
              <div>
                <span className="text-slate-500">Time used: </span>
                <strong className="text-slate-900">
                  {minutes}m {seconds}s
                </strong>
              </div>

              <div>
                <span className="text-slate-500">Questions: </span>
                <strong className="text-slate-900">
                  {result.exam.totalQuestions}
                </strong>
              </div>

              <div>
                <span className="text-slate-500">Correct: </span>
                <strong className="text-green-600">
                  {result.correctAnswers}
                </strong>
              </div>

              <div>
                <span className="text-slate-500">Wrong: </span>
                <strong className="text-red-600">
                  {result.wrongAnswers}
                </strong>
              </div>
            </div>
          </div>
        </section>

        {/* Mistakes */}
        <section className="mt-10">
          <div className="mb-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-100 text-lg font-bold text-red-600">
                !
              </div>

              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Review Your Mistakes
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Review the questions you answered incorrectly and learn from
                  the explanations.
                </p>
              </div>
            </div>
          </div>

          {result.mistakes.length === 0 ? (
            <div className="rounded-2xl border border-green-200 bg-green-50 p-8 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-600 text-2xl font-bold text-white">
                ✓
              </div>

              <h3 className="mt-4 text-xl font-bold text-green-800">
                No mistakes to review!
              </h3>

              <p className="mx-auto mt-2 max-w-xl text-sm text-green-700">
                Excellent work. You answered every marked question correctly.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {result.mistakes.map((mistake, index) => (
                <article
                  key={mistake.id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                >
                  {/* Mistake Header */}
                  <div className="border-b border-red-200 bg-red-50 px-6 py-5">
                    <div className="flex items-start gap-4">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-600 text-sm font-bold text-white">
                        {index + 1}
                      </div>

                      <div>
                        <span className="text-sm font-bold text-red-700">
                          Mistake {index + 1}
                        </span>

                        <h3 className="mt-2 text-lg font-semibold leading-7 text-slate-900">
                          {mistake.question.questionText}
                        </h3>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    {/* Answers */}
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="rounded-xl border border-red-200 bg-red-50 p-5">
                        <div className="flex items-center gap-2">
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white">
                            ×
                          </span>

                          <p className="text-sm font-bold text-red-700">
                            Your answer
                          </p>
                        </div>

                        <p className="mt-3 font-semibold leading-6 text-red-900">
                          {mistake.studentAnswer || "Not answered"}
                        </p>
                      </div>

                      <div className="rounded-xl border border-green-200 bg-green-50 p-5">
                        <div className="flex items-center gap-2">
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-green-600 text-xs font-bold text-white">
                            ✓
                          </span>

                          <p className="text-sm font-bold text-green-700">
                            Correct answer
                          </p>
                        </div>

                        <p className="mt-3 font-semibold leading-6 text-green-900">
                          {mistake.correctAnswer}
                        </p>
                      </div>
                    </div>

                    {/* Explanation */}
                    {mistake.explanation && (
                      <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50 p-5">
                        <div className="flex items-center gap-2">
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                            i
                          </span>

                          <p className="text-sm font-bold text-blue-700">
                            Explanation
                          </p>
                        </div>

                        <p className="mt-3 leading-7 text-blue-950">
                          {mistake.explanation}
                        </p>
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Actions */}
        <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Ready for another test?
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Keep practising and use your mistakes to improve.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/dashboard"
                className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Back to Dashboard
              </Link>

              <Link
                href="/dashboard#subjects"
                className="rounded-lg border border-blue-200 bg-white px-5 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Take Another Test
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}