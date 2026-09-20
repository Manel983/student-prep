import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

interface AdminResultDetailsPageProps {
  params: Promise<{
    id: string;
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

function formatDuration(seconds: number | null | undefined) {
  if (seconds === null || seconds === undefined) {
    return "—";
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${minutes}m ${remainingSeconds}s`;
}

function formatPercentage(
  value: string | number | null | undefined | { toString(): string }
) {
  if (value === null || value === undefined) {
    return "—";
  }

  return `${Number(value.toString()).toFixed(1)}%`;
}

export default async function AdminResultDetailsPage({
  params,
}: AdminResultDetailsPageProps) {
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

  const { id } = await params;

  if (!id) {
    redirect("/admin/results");
  }

  const result = await prisma.result.findFirst({
    where: {
      id,
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
        include: {
          subject: {
            select: {
              id: true,
              name: true,
            },
          },
          questions: {
            orderBy: {
              questionNo: "asc",
            },
            include: {
              question: {
                select: {
                  id: true,
                  questionText: true,
                  optionA: true,
                  optionB: true,
                  optionC: true,
                  optionD: true,
                  correctAnswer: true,
                  explanation: true,
                  marks: true,
                },
              },
            },
          },
          answers: {
            select: {
              questionId: true,
              answer: true,
              isCorrect: true,
              marksAwarded: true,
              answeredAt: true,
            },
          },
        },
      },
      mistakes: {
        orderBy: {
          createdAt: "asc",
        },
        include: {
          question: {
            select: {
              id: true,
              questionText: true,
            },
          },
        },
      },
    },
  });

  if (!result) {
    redirect("/admin/results");
  }

  const answersByQuestionId = new Map(
    result.exam.answers.map((answer) => [
      answer.questionId,
      answer,
    ])
  );

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Link
              href="/admin/results"
              className="text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              ← Back to Results
            </Link>

            <h1 className="mt-3 text-3xl font-bold text-slate-900">
              Result Details
            </h1>

            <p className="mt-2 text-slate-600">
              Detailed review of the student's examination result.
            </p>
          </div>
        </div>

        {/* Student Information */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">
            Student Information
          </h2>

          <div className="mt-6 grid gap-6 md:grid-cols-3">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Name
              </p>

              <p className="mt-1 font-semibold text-slate-900">
                {result.user.firstName} {result.user.lastName}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-500">
                Email
              </p>

              <p className="mt-1 text-slate-700">
                {result.user.email}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-500">
                Student ID
              </p>

              <p className="mt-1 break-all text-sm text-slate-700">
                {result.user.id}
              </p>
            </div>
          </div>
        </section>

        {/* Exam Information */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">
            Examination Information
          </h2>

          <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Exam
              </p>

              <p className="mt-1 font-semibold text-slate-900">
                {result.exam.title}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-500">
                Subject
              </p>

              <p className="mt-1 font-semibold text-slate-900">
                {result.exam.subject.name}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-500">
                Duration
              </p>

              <p className="mt-1 font-semibold text-slate-900">
                {result.exam.durationMinutes} minutes
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-500">
                Questions
              </p>

              <p className="mt-1 font-semibold text-slate-900">
                {result.exam.totalQuestions}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-500">
                Started
              </p>

              <p className="mt-1 text-sm text-slate-700">
                {formatDate(result.exam.startedAt)}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-500">
                Submitted
              </p>

              <p className="mt-1 text-sm text-slate-700">
                {formatDate(result.exam.submittedAt)}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-500">
                Completed
              </p>

              <p className="mt-1 text-sm text-slate-700">
                {formatDate(result.completedAt)}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-500">
                Time Used
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-900">
                {formatDuration(result.timeUsedSeconds)}
              </p>
            </div>
          </div>
        </section>

        {/* Result Summary */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">
            Result Summary
          </h2>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-xl bg-slate-50 p-5">
              <p className="text-sm font-medium text-slate-500">
                Score
              </p>

              <p className="mt-2 text-2xl font-bold text-slate-900">
                {result.score}/{result.totalMarks}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-5">
              <p className="text-sm font-medium text-slate-500">
                Percentage
              </p>

              <p className="mt-2 text-2xl font-bold text-blue-600">
                {formatPercentage(result.percentage)}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-5">
              <p className="text-sm font-medium text-slate-500">
                Correct
              </p>

              <p className="mt-2 text-2xl font-bold text-emerald-600">
                {result.correctAnswers}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-5">
              <p className="text-sm font-medium text-slate-500">
                Wrong
              </p>

              <p className="mt-2 text-2xl font-bold text-red-600">
                {result.wrongAnswers}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-5">
              <p className="text-sm font-medium text-slate-500">
                Unanswered
              </p>

              <p className="mt-2 text-2xl font-bold text-slate-600">
                {result.unanswered}
              </p>
            </div>
          </div>
        </section>

        {/* Questions */}
        <section className="mt-8">
          <div className="mb-5">
            <h2 className="text-2xl font-bold text-slate-900">
              Questions & Answers
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Review every question and the student's response.
            </p>
          </div>

          <div className="space-y-6">
            {result.exam.questions.map((examQuestion) => {
              const question = examQuestion.question;

              const answer = answersByQuestionId.get(
                question.id
              );

              const selectedAnswer = answer?.answer ?? null;

              const options = [
                ["A", question.optionA],
                ["B", question.optionB],
                ["C", question.optionC],
                ["D", question.optionD],
              ] as const;

              return (
                <article
                  key={examQuestion.id}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <span className="text-sm font-semibold text-blue-600">
                        Question {examQuestion.questionNo}
                      </span>

                      <h3 className="mt-2 text-lg font-semibold leading-7 text-slate-900">
                        {question.questionText}
                      </h3>
                    </div>

                    <span className="whitespace-nowrap rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                      {examQuestion.marks}{" "}
                      {examQuestion.marks === 1
                        ? "mark"
                        : "marks"}
                    </span>
                  </div>

                  <div className="mt-5 space-y-3">
                    {options.map(([letter, option]) => {
                      const isStudentAnswer =
                        selectedAnswer === letter;

                      const isCorrectAnswer =
                        question.correctAnswer === letter;

                      let optionClass =
                        "border-slate-200 bg-white";

                      if (isCorrectAnswer) {
                        optionClass =
                          "border-emerald-300 bg-emerald-50";
                      } else if (isStudentAnswer) {
                        optionClass =
                          "border-red-300 bg-red-50";
                      }

                      return (
                        <div
                          key={letter}
                          className={`rounded-xl border p-4 ${optionClass}`}
                        >
                          <div className="flex items-start gap-3">
                            <span className="font-bold text-slate-700">
                              {letter}.
                            </span>

                            <div className="flex-1">
                              <p className="text-slate-800">
                                {option}
                              </p>

                              <div className="mt-2 flex flex-wrap gap-2">
                                {isStudentAnswer && (
                                  <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-700">
                                    Student Answer
                                  </span>
                                )}

                                {isCorrectAnswer && (
                                  <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
                                    Correct Answer
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-sm font-semibold text-slate-600">
                        Student Response
                      </p>

                      <p className="mt-2 font-semibold text-slate-900">
                        {selectedAnswer
                          ? selectedAnswer
                          : "Not answered"}
                      </p>

                      {answer?.answeredAt && (
                        <p className="mt-1 text-xs text-slate-500">
                          Answered:{" "}
                          {formatDate(answer.answeredAt)}
                        </p>
                      )}
                    </div>

                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                      <p className="text-sm font-semibold text-emerald-700">
                        Correct Response
                      </p>

                      <p className="mt-2 font-semibold text-emerald-900">
                        {question.correctAnswer}
                      </p>
                    </div>
                  </div>

                  {answer && (
                    <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
                      <div className="flex flex-wrap gap-4 text-sm">
                        <span className="text-slate-600">
                          Correct:{" "}
                          <strong
                            className={
                              answer.isCorrect
                                ? "text-emerald-600"
                                : "text-red-600"
                            }
                          >
                            {answer.isCorrect
                              ? "Yes"
                              : "No"}
                          </strong>
                        </span>

                        <span className="text-slate-600">
                          Marks awarded:{" "}
                          <strong className="text-slate-900">
                            {answer.marksAwarded}
                          </strong>
                        </span>
                      </div>
                    </div>
                  )}

                  {question.explanation && (
                    <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50 p-4">
                      <p className="text-sm font-semibold text-blue-700">
                        Explanation
                      </p>

                      <p className="mt-2 leading-7 text-blue-900">
                        {question.explanation}
                      </p>
                    </div>
                  )}
                </article>
              );
            })}
          </div>

          {result.exam.questions.length === 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
              <p className="text-slate-500">
                No questions are associated with this result.
              </p>
            </div>
          )}
        </section>

        {/* Mistakes */}
        <section className="mt-8">
          <div className="mb-5">
            <h2 className="text-2xl font-bold text-slate-900">
              Mistakes
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Questions the student answered incorrectly or left
              unanswered.
            </p>
          </div>

          {result.mistakes.length === 0 ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
              <h3 className="text-xl font-bold text-emerald-800">
                No mistakes recorded
              </h3>

              <p className="mt-2 text-sm text-emerald-700">
                This result contains no recorded mistakes.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {result.mistakes.map((mistake, index) => (
                <article
                  key={mistake.id}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <span className="text-sm font-semibold text-red-600">
                    Mistake {index + 1}
                  </span>

                  <h3 className="mt-2 text-lg font-semibold text-slate-900">
                    {mistake.question.questionText}
                  </h3>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                      <p className="text-sm font-semibold text-red-700">
                        Student Answer
                      </p>

                      <p className="mt-2 font-semibold text-red-900">
                        {mistake.studentAnswer ||
                          "Not answered"}
                      </p>
                    </div>

                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                      <p className="text-sm font-semibold text-emerald-700">
                        Correct Answer
                      </p>

                      <p className="mt-2 font-semibold text-emerald-900">
                        {mistake.correctAnswer}
                      </p>
                    </div>
                  </div>

                  {mistake.explanation && (
                    <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4">
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

        {/* Bottom Navigation */}
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/admin/results"
            className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            ← Back to Results
          </Link>

          <Link
            href={`/admin/exams/${result.exam.id}`}
            className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            View Exam
          </Link>
        </div>
      </div>
    </main>
  );
}