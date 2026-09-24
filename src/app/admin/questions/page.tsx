import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import CreateQuestionForm from "./CreateQuestionForm";
import EditQuestionForm from "./EditQuestionForm";
import ArchiveQuestionButton from "./ArchiveQuestionButton";
import RestoreQuestionButton from "./RestoreQuestionButton";
import PublishQuestionButton from "./PublishQuestionButton";
import QuestionSelectionControls from "./QuestionSelectionControls";
import BulkPublishQuestionsButton from "./BulkPublishQuestionsButton";

interface AdminQuestionsPageProps {
  searchParams: Promise<{
    search?: string;
    subjectId?: string;
    classLevel?: string;
    topicId?: string;
    examType?: string;
    beceYear?: string;
    status?: string;
  }>;
}

const classLabels: Record<string, string> = {
  PRIMARY_1: "Primary 1",
  PRIMARY_2: "Primary 2",
  PRIMARY_3: "Primary 3",
  PRIMARY_4: "Primary 4",
  PRIMARY_5: "Primary 5",
  PRIMARY_6: "Primary 6",
  JHS_1: "JHS 1",
  JHS_2: "JHS 2",
  JHS_3: "JHS 3",
};

const examTypeLabels: Record<string, string> = {
  BECE: "BECE",
  LIKELY: "Likely Examination",
  TOPIC_BASED: "Topic-Based",
};

const validClassLevels = [
  "PRIMARY_1",
  "PRIMARY_2",
  "PRIMARY_3",
  "PRIMARY_4",
  "PRIMARY_5",
  "PRIMARY_6",
  "JHS_1",
  "JHS_2",
  "JHS_3",
] as const;

const validExamTypes = [
  "BECE",
  "LIKELY",
  "TOPIC_BASED",
] as const;

const validStatuses = [
  "DRAFT",
  "PUBLISHED",
  "ARCHIVED",
] as const;

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
  const classLevel = params.classLevel || "";
  const topicId = params.topicId || "";
  const examType = params.examType || "";
  const beceYear = params.beceYear || "";
  const status = params.status || "";

  const validClassLevel = validClassLevels.includes(
    classLevel as (typeof validClassLevels)[number]
  )
    ? (classLevel as (typeof validClassLevels)[number])
    : "";

  const validExamType = validExamTypes.includes(
    examType as (typeof validExamTypes)[number]
  )
    ? (examType as (typeof validExamTypes)[number])
    : "";

  const validStatus = validStatuses.includes(
    status as (typeof validStatuses)[number]
  )
    ? (status as (typeof validStatuses)[number])
    : "";

  const parsedBeceYear =
    beceYear && /^\d{4}$/.test(beceYear)
      ? Number(beceYear)
      : null;

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

        ...(subjectId
          ? {
              subjectId,
            }
          : {}),

        ...(validClassLevel
          ? {
              classLevel: validClassLevel,
            }
          : {}),

        ...(topicId
          ? {
              topicId,
            }
          : {}),

        ...(validExamType
          ? {
              examType: validExamType,
            }
          : {}),

        ...(parsedBeceYear
          ? {
              beceYear: parsedBeceYear,
            }
          : {}),

        ...(validStatus
          ? {
              status: validStatus,
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

  const totalQuestions = questions.length;

  const publishedQuestions = questions.filter(
    (question) => question.status === "PUBLISHED"
  ).length;

  const draftQuestions = questions.filter(
    (question) => question.status === "DRAFT"
  ).length;

  const archivedQuestions = questions.filter(
    (question) => question.status === "ARCHIVED"
  ).length;

  const selectedSubjectTopics = subjectId
    ? topics.filter((topic) => topic.subjectId === subjectId)
    : topics;

  const hasActiveFilters =
    search ||
    subjectId ||
    classLevel ||
    topicId ||
    examType ||
    beceYear ||
    status;

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <img
                  src="/logo.jpg"
                  alt="Student Prep"
                  className="h-11 w-auto object-contain"
                />

                <div>
                  <p className="text-sm font-bold text-blue-600">
                    Student Prep Administration
                  </p>

                  <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                    Question Bank
                  </h1>
                </div>
              </div>

              <p className="mt-3 text-sm text-slate-500">
                View and manage the examination question bank.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-2 text-xs font-semibold text-green-700">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                Admin access active
              </span>

              <Link
                href="/admin"
                className="inline-flex items-center rounded-lg border border-blue-200 bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
              >
                ← Admin Dashboard
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Overview */}
        <section className="mb-8">
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="h-8 w-1 rounded-full bg-blue-600" />

                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Question Overview
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Monitor the questions currently returned by your
                    selected filters.
                  </p>
                </div>
              </div>
            </div>

            <CreateQuestionForm
              subjects={subjects}
              topics={topics}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-blue-200 bg-white p-5 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-lg">
                ?
              </div>

              <p className="mt-4 text-sm font-medium text-slate-500">
                Questions Found
              </p>

              <p className="mt-1 text-3xl font-bold text-slate-900">
                {totalQuestions.toLocaleString()}
              </p>
            </div>

            <div className="rounded-2xl border border-green-200 bg-white p-5 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 text-lg">
                ✓
              </div>

              <p className="mt-4 text-sm font-medium text-slate-500">
                Published
              </p>

              <p className="mt-1 text-3xl font-bold text-green-700">
                {publishedQuestions.toLocaleString()}
              </p>
            </div>

            <div className="rounded-2xl border border-blue-200 bg-white p-5 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-lg">
                ✎
              </div>

              <p className="mt-4 text-sm font-medium text-slate-500">
                Drafts
              </p>

              <p className="mt-1 text-3xl font-bold text-blue-700">
                {draftQuestions.toLocaleString()}
              </p>
            </div>

            <div className="rounded-2xl border border-red-200 bg-white p-5 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-lg">
                !
              </div>

              <p className="mt-4 text-sm font-medium text-slate-500">
                Archived
              </p>

              <p className="mt-1 text-3xl font-bold text-red-600">
                {archivedQuestions.toLocaleString()}
              </p>
            </div>
          </div>
        </section>

        {/* Advanced Filters */}
        <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <div className="flex items-center gap-3">
              <div className="h-8 w-1 rounded-full bg-green-600" />

              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Filter Questions
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Filter the question bank by subject, class, topic,
                  examination type, BECE year, or status.
                </p>
              </div>
            </div>
          </div>

          <form
            method="GET"
            className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
          >
            {/* Search */}
            <div className="lg:col-span-3">
              <label
                htmlFor="search"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Search
              </label>

              <input
                id="search"
                name="search"
                type="search"
                defaultValue={search}
                placeholder="Search question text or explanation..."
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Subject */}
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

            {/* Class */}
            <div>
              <label
                htmlFor="classLevel"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Class
              </label>

              <select
                id="classLevel"
                name="classLevel"
                defaultValue={classLevel}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">All Classes</option>

                {validClassLevels.map((level) => (
                  <option key={level} value={level}>
                    {classLabels[level]}
                  </option>
                ))}
              </select>
            </div>

            {/* Topic */}
            <div>
              <label
                htmlFor="topicId"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Topic
              </label>

              <select
                id="topicId"
                name="topicId"
                defaultValue={topicId}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">All Topics</option>

                {selectedSubjectTopics.map((topic) => (
                  <option key={topic.id} value={topic.id}>
                    {topic.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Exam Type */}
            <div>
              <label
                htmlFor="examType"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Exam Type
              </label>

              <select
                id="examType"
                name="examType"
                defaultValue={examType}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">All Exam Types</option>

                {validExamTypes.map((type) => (
                  <option key={type} value={type}>
                    {examTypeLabels[type]}
                  </option>
                ))}
              </select>
            </div>

            {/* BECE Year */}
            <div>
              <label
                htmlFor="beceYear"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                BECE Year
              </label>

              <input
                id="beceYear"
                name="beceYear"
                type="number"
                min="1990"
                max="2100"
                defaultValue={beceYear}
                placeholder="e.g. 2024"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Status */}
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

            {/* Filter Actions */}
            <div className="flex flex-col gap-3 sm:flex-row md:col-span-2 lg:col-span-3">
              <button
                type="submit"
                className="rounded-xl bg-blue-600 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Apply Filters
              </button>

              {hasActiveFilters && (
                <Link
                  href="/admin/questions"
                  className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Clear Filters
                </Link>
              )}
            </div>
          </form>
        </section>

        {/* Question Selection and Bulk Actions */}
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <QuestionSelectionControls
              totalQuestions={totalQuestions}
            />
          </div>

          <div className="shrink-0">
            <BulkPublishQuestionsButton />
          </div>
        </div>

        {/* Results */}
        <section>
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Question List
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Showing{" "}
                <span className="font-semibold text-slate-900">
                  {questions.length.toLocaleString()}
                </span>{" "}
                {questions.length === 1
                  ? "question"
                  : "questions"}
                .
              </p>
            </div>

            {hasActiveFilters && (
              <span className="inline-flex w-fit rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                Filters active
              </span>
            )}
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="w-16 px-6 py-4 text-left text-sm font-semibold text-slate-700">
                      Select
                    </th>

                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                      Question
                    </th>

                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                      Subject
                    </th>

                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                      Class
                    </th>

                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                      Topic
                    </th>

                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                      Exam Type
                    </th>

                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                      BECE Year
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
                      className="transition hover:bg-slate-50"
                    >
                      <td className="px-6 py-4 align-top">
                        <input
                          type="checkbox"
                          value={question.id}
                          data-question-selection="true"
                          aria-label={`Select question: ${question.questionText}`}
                          className="h-5 w-5 cursor-pointer rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                        />
                      </td>

                      <td className="max-w-md px-6 py-4 align-top">
                        <p className="font-medium leading-6 text-slate-900">
                          {question.questionText}
                        </p>
                      </td>

                      <td className="whitespace-nowrap px-6 py-4 align-top text-sm text-slate-600">
                        {question.subject.name}
                      </td>

                      <td className="whitespace-nowrap px-6 py-4 align-top">
                        <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                          {classLabels[question.classLevel] ??
                            question.classLevel}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-6 py-4 align-top text-sm text-slate-600">
                        {question.topic?.name || "—"}
                      </td>

                      <td className="whitespace-nowrap px-6 py-4 align-top">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            question.examType === "BECE"
                              ? "bg-green-100 text-green-700"
                              : question.examType === "LIKELY"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {examTypeLabels[question.examType] ??
                            question.examType}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-6 py-4 align-top text-sm font-semibold text-slate-700">
                        {question.beceYear ?? "—"}
                      </td>

                      <td className="px-6 py-4 align-top">
                        <div className="flex min-w-[360px] flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                              question.status === "PUBLISHED"
                                ? "bg-green-100 text-green-700"
                                : question.status === "DRAFT"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-red-100 text-red-700"
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
                        colSpan={8}
                        className="px-6 py-16 text-center"
                      >
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-2xl">
                          ?
                        </div>

                        <h3 className="mt-4 text-lg font-bold text-slate-900">
                          No questions found
                        </h3>

                        <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                          No questions match the selected filters.
                          Try changing your search or filter
                          selections.
                        </p>

                        {hasActiveFilters && (
                          <Link
                            href="/admin/questions"
                            className="mt-5 inline-flex rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                          >
                            Clear Filters
                          </Link>
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Navigation */}
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/admin"
            className="inline-flex items-center rounded-lg border border-blue-200 bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
          >
            ← Admin Dashboard
          </Link>

          <Link
            href="/admin/subjects"
            className="inline-flex items-center rounded-lg border border-green-200 bg-white px-4 py-2.5 text-sm font-semibold text-green-700 transition hover:bg-green-50"
          >
            Manage Subjects →
          </Link>

          <Link
            href="/admin/topics"
            className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Manage Topics →
          </Link>
        </div>
      </div>
    </main>
  );
}