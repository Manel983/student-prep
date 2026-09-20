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

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
          <div>
            <Link
              href="/dashboard"
              className="text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              ← Back to Dashboard
            </Link>

            <h1 className="mt-3 text-2xl font-bold text-slate-900">
              Test Results
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              {result.exam.subject.name} · {result.exam.title}
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Performance Summary */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-6 md:grid-cols-4">
            <div className="rounded-xl bg-slate-50 p-5 text-center">
              <p className="text-sm font-medium text-slate-500">Score</p>

              <p className="mt-2 text-3xl font-bold text-slate-900">
                {result.score}/{result.totalMarks}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-5 text-center">
              <p className="text-sm font-medium text-slate-500">
                Percentage
              </p>

              <p className="mt-2 text-3xl font-bold text-blue-600">
                {percentage}%
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-5 text-center">
              <p className="text-sm font-medium text-slate-500">Correct</p>

              <p className="mt-2 text-3xl font-bold text-green-600">
                {result.correctAnswers}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-5 text-center">
              <p className="text-sm font-medium text-slate-500">
                Unanswered
              </p>

              <p className="mt-2 text-3xl font-bold text-slate-600">
                {result.unanswered}
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-slate-200 p-5">
            <h2 className="text-xl font-bold text-slate-900">
              {performanceMessage}
            </h2>

            <p className="mt-2 text-slate-600">
              {performanceDescription}
            </p>

            <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-600">
              <span>
                Wrong answers:{" "}
                <strong className="text-red-600">
                  {result.wrongAnswers}
                </strong>
              </span>

              <span>
                Time used:{" "}
                <strong className="text-slate-900">
                  {minutes}m {seconds}s
                </strong>
              </span>

              <span>
                Questions:{" "}
                <strong className="text-slate-900">
                  {result.exam.totalQuestions}
                </strong>
              </span>
            </div>
          </div>
        </section>

        {/* Mistakes */}
        <section className="mt-8">
          <div className="mb-5">
            <h2 className="text-2xl font-bold text-slate-900">
              Review Your Mistakes
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Review the questions you answered incorrectly and learn from
              the explanations.
            </p>
          </div>

          {result.mistakes.length === 0 ? (
            <div className="rounded-2xl border border-green-200 bg-green-50 p-8 text-center">
              <h3 className="text-xl font-bold text-green-800">
                No mistakes to review!
              </h3>

              <p className="mt-2 text-sm text-green-700">
                Excellent work. You answered every marked question correctly.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {result.mistakes.map((mistake, index) => (
                <article
                  key={mistake.id}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="text-sm font-semibold text-red-600">
                        Mistake {index + 1}
                      </span>

                      <h3 className="mt-2 text-lg font-semibold text-slate-900">
                        {mistake.question.questionText}
                      </h3>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                      <p className="text-sm font-semibold text-red-700">
                        Your answer
                      </p>

                      <p className="mt-2 font-medium text-red-900">
                        {mistake.studentAnswer || "Not answered"}
                      </p>
                    </div>

                    <div className="rounded-xl border border-green-200 bg-green-50 p-4">
                      <p className="text-sm font-semibold text-green-700">
                        Correct answer
                      </p>

                      <p className="mt-2 font-medium text-green-900">
                        {mistake.correctAnswer}
                      </p>
                    </div>
                  </div>

                  {mistake.explanation && (
                    <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50 p-4">
                      <p className="text-sm font-semibold text-blue-700">
                        Explanation
                      </p>

                      <p className="mt-2 leading-7 text-blue-900">
                        {mistake.explanation}
                      </p>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Actions */}
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/dashboard"
            className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Back to Dashboard
          </Link>

          <Link
            href="/dashboard#subjects"
            className="rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Take Another Test
          </Link>
        </div>
      </div>
    </main>
  );
}