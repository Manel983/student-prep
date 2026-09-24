import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import ImportQuestionsButton from "./ImportQuestionsButton";

interface ReviewPageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    page?: string;
  }>;
}

const ITEMS_PER_PAGE = 25;

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

function getClassLabel(
  classLevel: string | null
) {
  if (!classLevel) {
    return "Not assigned";
  }

  return (
    classLabels[classLevel] ??
    classLevel
  );
}

function getExamTypeLabel(
  examType: string | null
) {
  if (!examType) {
    return "Not assigned";
  }

  return (
    examTypeLabels[examType] ??
    examType
  );
}

export default async function QuestionImportReviewPage({
  params,
  searchParams,
}: ReviewPageProps) {
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

  const { id } = await params;
  const { page: pageParam } = await searchParams;

  const requestedPage = Number(
    pageParam ?? "1"
  );

  const page =
    Number.isInteger(requestedPage) &&
    requestedPage > 0
      ? requestedPage
      : 1;

  const questionImport =
    await prisma.questionImport.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        fileName: true,
        fileType: true,
        fileSize: true,
        status: true,
        totalItems: true,
        errorMessage: true,
        createdAt: true,
        updatedAt: true,
      },
    });

  if (!questionImport) {
    redirect("/admin/question-imports");
  }

  const totalItems =
    await prisma.questionImportItem.count({
      where: {
        importId: id,
      },
    });

  const totalPages = Math.max(
    1,
    Math.ceil(
      totalItems / ITEMS_PER_PAGE
    )
  );

  const safePage = Math.min(
    page,
    totalPages
  );

  const items =
    await prisma.questionImportItem.findMany({
      where: {
        importId: id,
      },
      select: {
        id: true,
        questionText: true,
        optionA: true,
        optionB: true,
        optionC: true,
        optionD: true,
        correctAnswer: true,
        explanation: true,
        suggestedClassLevel: true,
        suggestedExamType: true,
        suggestedBeceYear: true,
        suggestedTopicId: true,
        status: true,
        reviewNotes: true,
      },
      orderBy: {
        createdAt: "asc",
      },
      skip:
        (safePage - 1) *
        ITEMS_PER_PAGE,
      take: ITEMS_PER_PAGE,
    });

  const firstItemNumber =
    totalItems === 0
      ? 0
      : (safePage - 1) *
          ITEMS_PER_PAGE +
        1;

  const lastItemNumber =
    Math.min(
      safePage * ITEMS_PER_PAGE,
      totalItems
    );

  const formattedFileSize =
    questionImport.fileSize
      ? `${(
          questionImport.fileSize /
          1024 /
          1024
        ).toFixed(2)} MB`
      : "Unknown";

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <Link
                href="/admin/question-imports"
                className="text-sm font-semibold text-blue-600 hover:text-blue-700"
              >
                ← Back to Question Imports
              </Link>

              <div className="mt-4 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-xl font-bold text-blue-700">
                  ?
                </div>

                <div>
                  <h1 className="text-2xl font-bold text-slate-900">
                    Import Review Room
                  </h1>

                  <p className="mt-1 text-sm text-slate-500">
                    Review imported questions before they enter the live question bank.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <span
                className={`inline-flex items-center rounded-full px-3 py-2 text-xs font-semibold ${
                  questionImport.status ===
                  "READY_FOR_REVIEW"
                    ? "bg-green-100 text-green-700"
                    : questionImport.status ===
                        "IMPORTED"
                      ? "bg-blue-100 text-blue-700"
                      : questionImport.status ===
                          "FAILED"
                        ? "bg-red-100 text-red-700"
                        : "bg-slate-100 text-slate-700"
                }`}
              >
                {questionImport.status.replace(
                  /_/g,
                  " "
                )}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Import Summary */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl bg-blue-50 p-5">
              <p className="text-sm font-medium text-blue-700">
                Imported Questions
              </p>

              <p className="mt-2 text-3xl font-bold text-slate-900">
                {totalItems.toLocaleString()}
              </p>
            </div>

            <div className="rounded-xl bg-green-50 p-5">
              <p className="text-sm font-medium text-green-700">
                Import Status
              </p>

              <p className="mt-2 text-lg font-bold text-slate-900">
                {questionImport.status.replace(
                  /_/g,
                  " "
                )}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-5">
              <p className="text-sm font-medium text-slate-500">
                File
              </p>

              <p className="mt-2 break-all text-sm font-bold text-slate-900">
                {questionImport.fileName}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                {formattedFileSize}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-5">
              <p className="text-sm font-medium text-slate-500">
                Current Page
              </p>

              <p className="mt-2 text-3xl font-bold text-slate-900">
                {safePage}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                of {totalPages.toLocaleString()} pages
              </p>
            </div>
          </div>

          {questionImport.errorMessage && (
            <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-semibold text-amber-800">
                Import Notice
              </p>

              <p className="mt-1 text-sm text-amber-700">
                {questionImport.errorMessage}
              </p>
            </div>
          )}
        </section>

        {/* Review Information */}
        <section className="mt-8 rounded-2xl border border-blue-200 bg-blue-50 p-5">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="font-bold text-blue-900">
                Review Before Import
              </h2>

              <p className="mt-2 text-sm leading-6 text-blue-800">
                These questions are currently in the import staging area.
                They are not yet available to students. Review the question
                text, options, answers, class, topic, and examination type
                before approving them for the main question bank.
              </p>
            </div>

            {questionImport.status ===
              "READY_FOR_REVIEW" && (
              <div className="shrink-0">
                <ImportQuestionsButton
                  importId={questionImport.id}
                  totalItems={totalItems}
                />
              </div>
            )}
          </div>
        </section>

        {/* Question List */}
        <section className="mt-8">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                Imported Questions
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Showing questions{" "}
                {firstItemNumber.toLocaleString()}–
                {lastItemNumber.toLocaleString()} of{" "}
                {totalItems.toLocaleString()}.
              </p>
            </div>

            <span className="text-sm font-medium text-slate-500">
              {ITEMS_PER_PAGE} questions per page
            </span>
          </div>

          {items.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
              <h3 className="text-xl font-bold text-slate-900">
                No imported questions found
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                This import does not currently contain any review items.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {items.map((item, index) => {
                const questionNumber =
                  firstItemNumber + index;

                const classLabel =
                  getClassLabel(
                    item.suggestedClassLevel
                  );

                const examTypeLabel =
                  getExamTypeLabel(
                    item.suggestedExamType
                  );

                return (
                  <article
                    key={item.id}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                  >
                    {/* Question Header */}
                    <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <span className="text-sm font-bold text-blue-600">
                            Question{" "}
                            {questionNumber}
                          </span>

                          <span className="ml-3 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
                            {item.status}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-2 text-xs">
                          <span className="rounded-full bg-blue-100 px-3 py-1.5 font-semibold text-blue-700">
                            {classLabel}
                          </span>

                          <span className="rounded-full bg-green-100 px-3 py-1.5 font-semibold text-green-700">
                            {examTypeLabel}
                          </span>

                          {item.suggestedBeceYear && (
                            <span className="rounded-full bg-slate-200 px-3 py-1.5 font-semibold text-slate-700">
                              BECE{" "}
                              {item.suggestedBeceYear}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="p-6">
                      {/* Question */}
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Question
                        </p>

                        <p className="mt-2 text-base font-semibold leading-7 text-slate-900">
                          {item.questionText}
                        </p>
                      </div>

                      {/* Options */}
                      <div className="mt-6 grid gap-3 sm:grid-cols-2">
                        <div
                          className={`rounded-xl border p-4 ${
                            item.correctAnswer ===
                            "A"
                              ? "border-green-200 bg-green-50"
                              : "border-slate-200 bg-white"
                          }`}
                        >
                          <span className="font-bold text-slate-700">
                            A.
                          </span>{" "}
                          <span className="text-slate-700">
                            {item.optionA}
                          </span>

                          {item.correctAnswer ===
                            "A" && (
                            <span className="ml-2 text-xs font-bold text-green-700">
                              Correct
                            </span>
                          )}
                        </div>

                        <div
                          className={`rounded-xl border p-4 ${
                            item.correctAnswer ===
                            "B"
                              ? "border-green-200 bg-green-50"
                              : "border-slate-200 bg-white"
                          }`}
                        >
                          <span className="font-bold text-slate-700">
                            B.
                          </span>{" "}
                          <span className="text-slate-700">
                            {item.optionB}
                          </span>

                          {item.correctAnswer ===
                            "B" && (
                            <span className="ml-2 text-xs font-bold text-green-700">
                              Correct
                            </span>
                          )}
                        </div>

                        <div
                          className={`rounded-xl border p-4 ${
                            item.correctAnswer ===
                            "C"
                              ? "border-green-200 bg-green-50"
                              : "border-slate-200 bg-white"
                          }`}
                        >
                          <span className="font-bold text-slate-700">
                            C.
                          </span>{" "}
                          <span className="text-slate-700">
                            {item.optionC}
                          </span>

                          {item.correctAnswer ===
                            "C" && (
                            <span className="ml-2 text-xs font-bold text-green-700">
                              Correct
                            </span>
                          )}
                        </div>

                        <div
                          className={`rounded-xl border p-4 ${
                            item.correctAnswer ===
                            "D"
                              ? "border-green-200 bg-green-50"
                              : "border-slate-200 bg-white"
                          }`}
                        >
                          <span className="font-bold text-slate-700">
                            D.
                          </span>{" "}
                          <span className="text-slate-700">
                            {item.optionD}
                          </span>

                          {item.correctAnswer ===
                            "D" && (
                            <span className="ml-2 text-xs font-bold text-green-700">
                              Correct
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Classification */}
                      <div className="mt-6 grid gap-4 md:grid-cols-3">
                        <div className="rounded-xl border border-slate-200 p-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Class
                          </p>

                          <p className="mt-1 font-semibold text-slate-900">
                            {classLabel}
                          </p>
                        </div>

                        <div className="rounded-xl border border-slate-200 p-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Exam Type
                          </p>

                          <p className="mt-1 font-semibold text-slate-900">
                            {examTypeLabel}
                          </p>
                        </div>

                        <div className="rounded-xl border border-slate-200 p-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Topic
                          </p>

                          <p className="mt-1 break-all font-semibold text-slate-900">
                            Topic ID:{" "}
                            {item.suggestedTopicId ??
                              "Not assigned"}
                          </p>
                        </div>
                      </div>

                      {/* Explanation */}
                      {item.explanation && (
                        <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                            Explanation
                          </p>

                          <p className="mt-2 text-sm leading-6 text-blue-900">
                            {item.explanation}
                          </p>
                        </div>
                      )}

                      {/* Review Notes */}
                      {item.reviewNotes && (
                        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                            Review Notes
                          </p>

                          <p className="mt-2 text-sm text-amber-900">
                            {item.reviewNotes}
                          </p>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* Pagination */}
        {totalPages > 1 && (
          <nav className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-sm text-slate-500">
              Page{" "}
              <strong className="text-slate-900">
                {safePage}
              </strong>{" "}
              of{" "}
              <strong className="text-slate-900">
                {totalPages}
              </strong>
            </div>

            <div className="flex flex-wrap gap-2">
              {safePage > 1 && (
                <Link
                  href={`/admin/question-imports/${id}/review?page=${
                    safePage - 1
                  }`}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  ← Previous
                </Link>
              )}

              {safePage < totalPages && (
                <Link
                  href={`/admin/question-imports/${id}/review?page=${
                    safePage + 1
                  }`}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  Next →
                </Link>
              )}
            </div>
          </nav>
        )}

        {/* Bottom Navigation */}
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/admin/question-imports"
            className="rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Back to Imports
          </Link>
        </div>
      </div>
    </main>
  );
}