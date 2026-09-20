import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

interface AdminExamDetailsPageProps {
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

export default async function AdminExamDetailsPage({
  params,
}: AdminExamDetailsPageProps) {
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
    redirect("/admin/exams");
  }

  const exam = await prisma.exam.findUnique({
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
  });

  if (!exam) {
    redirect("/admin/exams");
  }

  const answersByQuestionId = new Map(
    exam.answers.map((answer) => [
      answer.questionId,
      answer,
    ])
  );

  const percentage = exam.result
    ? Number(exam.result.percentage)
    : null;

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Link
              href="/admin/exams"
              className="text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              ← Back to Exams
            </Link>

            <h1 className="mt-3 text-3xl font-bold text-slate-900">
              Exam Details
            </h1>

            <p className="mt-2 text-slate-600">
              Review the student's examination activity and answers.
            </p>
          </div>

          <div>
            <span
              className={`inline-flex rounded-full px-4 py-2 text-sm font-semibold ${statusClasses(
                exam.status
              )}`}
            >
              {statusLabel(exam.status)}
            </span>
          </div>
        </div>

        {/* Exam Information */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">
            Examination Information
          </h2>

          <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Exam Title
              </p>

              <p className="mt-1 font-semibold text-slate-900">
                {exam.title}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-500">
                Subject
              </p>

              <p className="mt-1 font-semibold text-slate-900">
                {exam.subject.name}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-500">
                Questions
              </p>

              <p className="mt-1 font-semibold text-slate-900">
                {exam.totalQuestions}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-500">
                Duration
              </p>

              <p className="mt-1 font-semibold text-slate-900">
                {exam.durationMinutes} minutes
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-500">
                Created
              </p>

              <p className="mt-1 text-sm text-slate-700">
                {formatDate(exam.createdAt)}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-500">
                Started
              </p>

              <p className="mt-1 text-sm text-slate-700">
                {formatDate(exam.startedAt)}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-500">
                Expires
              </p>

              <p className="mt-1 text-sm text-slate-700">
                {formatDate(exam.expiresAt)}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-500">
                Submitted
              </p>

              <p className="mt-1 text-sm text-slate-700">
                {formatDate(exam.submittedAt)}
              </p>
            </div>
          </div>
        </section>

        {/* Student Information */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">
            Student Information
          </h2>

          <div className="mt-6 grid gap-6 md:grid-cols-3">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Name
              </p>

              <p className="mt-1 font-semibold text-slate-900">
                {exam.user.firstName} {exam.user.lastName}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-500">
                Email
              </p>

              <p className="mt-1 text-slate-700">
                {exam.user.email}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-500">
                Student ID
              </p>

              <p className="mt-1 break-all text-sm text-slate-700">
                {exam.user.id}
              </p>
            </div>
          </div>
        </section>

        {/* Result */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">
            Result
          </h2>

          {!exam.result ? (
            <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-5">
              <p className="font-semibold text-amber-800">
                No result available
              </p>

              <p className="mt-1 text-sm text-amber-700">
                This exam has not produced a marked result.
              </p>
            </div>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl bg-slate-50 p-5">
                <p className="text-sm font-medium text-slate-500">
                  Score
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {exam.result.score}/{exam.result.totalMarks}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-5">
                <p className="text-sm font-medium text-slate-500">
                  Percentage
                </p>

                <p className="mt-2 text-2xl font-bold text-blue-600">
                  {percentage}%
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-5">
                <p className="text-sm font-medium text-slate-500">
                  Correct
                </p>

                <p className="mt-2 text-2xl font-bold text-emerald-600">
                  {exam.result.correctAnswers}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-5">
                <p className="text-sm font-medium text-slate-500">
                  Wrong
                </p>

                <p className="mt-2 text-2xl font-bold text-red-600">
                  {exam.result.wrongAnswers}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-5">
                <p className="text-sm font-medium text-slate-500">
                  Unanswered
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-600">
                  {exam.result.unanswered}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-5">
                <p className="text-sm font-medium text-slate-500">
                  Time Used
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {formatDuration(
                    exam.result.timeUsedSeconds
                  )}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-5 sm:col-span-2">
                <p className="text-sm font-medium text-slate-500">
                  Completed
                </p>

                <p className="mt-2 font-semibold text-slate-900">
                  {formatDate(exam.result.completedAt)}
                </p>
              </div>
            </div>
          )}
        </section>

        {/* Questions and Answers */}
        <section className="mt-6">
          <div className="mb-5">
            <h2 className="text-2xl font-bold text-slate-900">
              Questions & Answers
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Review each question, the student's answer, and the
              correct answer.
            </p>
          </div>

          <div className="space-y-6">
            {exam.questions.map((examQuestion) => {
              const question = examQuestion.question;
              const answer = answersByQuestionId.get(
                question.id
              );

              const selectedAnswer = answer?.answer ?? null;

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
                    {[
                      ["A", question.optionA],
                      ["B", question.optionB],
                      ["C", question.optionC],
                      ["D", question.optionD],
                    ].map(([letter, option]) => {
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

          {exam.questions.length === 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
              <p className="text-slate-500">
                No questions are associated with this exam.
              </p>
            </div>
          )}
        </section>

        {/* Bottom Navigation */}
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/admin/exams"
            className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            ← Back to Exams
          </Link>
        </div>
      </div>
    </main>
  );
}