import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import CreateQuestionForm from "./CreateQuestionForm";
import EditQuestionForm from "./EditQuestionForm";
import ArchiveQuestionButton from "./ArchiveQuestionButton";
import RestoreQuestionButton from "./RestoreQuestionButton";
import PublishQuestionButton from "./PublishQuestionButton";

interface AdminQuestionsPageProps {
  searchParams: Promise<{
    search?: string;
    subjectId?: string;
    difficulty?: string;
    status?: string;
  }>;
}

export default async function AdminQuestionsPage({
  searchParams,
}: AdminQuestionsPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const params = await searchParams;

  const search = params.search?.trim() || "";
  const subjectId = params.subjectId || "";
  const difficulty = params.difficulty || "";
  const status = params.status || "";

  const [questions, subjects, topics] = await Promise.all([
    prisma.question.findMany({
      where: {
        ...(search
          ? {
              OR: [
                {
                  questionText: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
                {
                  explanation: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
              ],
            }
          : {}),
        ...(subjectId ? { subjectId } : {}),
        ...(difficulty &&
        ["EASY", "MEDIUM", "HARD"].includes(difficulty)
          ? {
              difficulty: difficulty as
                | "EASY"
                | "MEDIUM"
                | "HARD",
            }
          : {}),
        ...(status &&
        ["DRAFT", "PUBLISHED", "ARCHIVED"].includes(status)
          ? {
              status: status as
                | "DRAFT"
                | "PUBLISHED"
                | "ARCHIVED",
            }
          : {}),
      },
      include: {
        subject: {
          select: {
            id: true,
            name: true,
          },
        },
        topic: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
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

    prisma.topic.findMany({
      select: {
        id: true,
        name: true,
        subjectId: true,
      },
      orderBy: {
        name: "asc",
      },
    }),
  ]);

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Questions
            </h1>

            <p className="mt-2 text-slate-600">
              View and manage the examination question bank.
            </p>
          </div>

          <Link
            href="/admin"
            className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            ← Admin Dashboard
          </Link>
        </div>

        <div className="mb-6 flex justify-end">
          <CreateQuestionForm
            subjects={subjects}
            topics={topics}
          />
        </div>

        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Filter Questions
          </h2>

          <form
            method="GET"
            className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-5"
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
                placeholder="Search question text..."
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

            <div>
              <label
                htmlFor="difficulty"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Difficulty
              </label>

              <select
                id="difficulty"
                name="difficulty"
                defaultValue={difficulty}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">All Difficulties</option>
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
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
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>

            <div className="flex flex-col gap-3 md:col-span-2 lg:col-span-5 sm:flex-row">
              <button
                type="submit"
                className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Apply Filters
              </button>

              {(search ||
                subjectId ||
                difficulty ||
                status) && (
                <Link
                  href="/admin/questions"
                  className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Clear Filters
                </Link>
              )}
            </div>
          </form>
        </div>

        <div className="mb-4">
          <p className="text-sm text-slate-600">
            Showing{" "}
            <span className="font-semibold text-slate-900">
              {questions.length}
            </span>{" "}
            {questions.length === 1
              ? "question"
              : "questions"}
            .
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    Question
                  </th>

                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    Subject
                  </th>

                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    Topic
                  </th>

                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    Difficulty
                  </th>

                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    Marks
                  </th>

                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    Status / Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {questions.map((question) => (
                  <tr
                    key={question.id}
                    className="hover:bg-slate-50"
                  >
                    <td className="max-w-md px-6 py-4">
                      <p className="font-medium text-slate-900">
                        {question.questionText}
                      </p>
                    </td>

                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                      {question.subject.name}
                    </td>

                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                      {question.topic?.name || "—"}
                    </td>

                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          question.difficulty === "EASY"
                            ? "bg-green-100 text-green-700"
                            : question.difficulty === "MEDIUM"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {question.difficulty}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                      {question.marks}
                    </td>

                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
                            question.status === "PUBLISHED"
                              ? "bg-green-100 text-green-700"
                              : question.status === "DRAFT"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-slate-200 text-slate-700"
                          }`}
                        >
                          {question.status}
                        </span>

                        <EditQuestionForm
                          id={question.id}
                          initialSubjectId={
                            question.subjectId
                          }
                          initialTopicId={
                            question.topicId || ""
                          }
                          initialQuestionText={
                            question.questionText
                          }
                          initialOptionA={question.optionA}
                          initialOptionB={question.optionB}
                          initialOptionC={question.optionC}
                          initialOptionD={question.optionD}
                          initialCorrectAnswer={
                            question.correctAnswer
                          }
                          initialExplanation={
                            question.explanation || ""
                          }
                          initialDifficulty={
                            question.difficulty
                          }
                          initialMarks={question.marks}
                          initialStatus={question.status}
                          subjects={subjects}
                          topics={topics}
                        />

                        <PublishQuestionButton
                          id={question.id}
                          status={question.status}
                        />

                        <ArchiveQuestionButton
                          id={question.id}
                          status={question.status}
                        />

                        <RestoreQuestionButton
                          id={question.id}
                          status={question.status}
                        />
                      </div>
                    </td>
                  </tr>
                ))}

                {questions.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center text-sm text-slate-500"
                    >
                      No questions found matching the
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