import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import StartExamButton from "./StartExamButton";

interface ExaminationSettingsPageProps {
  params: Promise<{
    subjectId: string;
  }>;
  searchParams: Promise<{
    duration?: string;
    examType?: string;
    beceYear?: string;
    topicId?: string;
    questionCount?: string;
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
  LIKELY: "Likely Examination Questions",
  TOPIC_BASED: "Topic-Based Examination",
};

const durationOptions = [
  {
    value: "2700",
    label: "45 minutes",
  },
  {
    value: "3600",
    label: "1 hour",
  },
  {
    value: "4500",
    label: "1 hour 15 minutes",
  },
  {
    value: "5400",
    label: "1 hour 30 minutes",
  },
  {
    value: "6300",
    label: "1 hour 45 minutes",
  },
  {
    value: "7200",
    label: "2 hours",
  },
];

const questionCountOptions = [
  {
    value: "20",
    label: "20 questions",
  },
  {
    value: "25",
    label: "25 questions",
  },
  {
    value: "30",
    label: "30 questions",
  },
  {
    value: "35",
    label: "35 questions",
  },
  {
    value: "40",
    label: "40 questions",
  },
];

const examTypeOptions = [
  {
    value: "BECE",
    label: "BECE",
  },
  {
    value: "LIKELY",
    label: "Likely Examination Questions",
  },
  {
    value: "TOPIC_BASED",
    label: "Topic-Based Examination",
  },
];

export default async function ExaminationSettingsPage({
  params,
  searchParams,
}: ExaminationSettingsPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { subjectId } = await params;
  const selectedParams = await searchParams;

  const selectedDuration =
    selectedParams.duration ?? "";

  const selectedExamType =
    selectedParams.examType ?? "";

  const selectedBeceYear =
    selectedParams.beceYear ?? "";

  const selectedTopicId =
    selectedParams.topicId ?? "";

  const selectedQuestionCount =
    selectedParams.questionCount ?? "";

  const [subject, profile, topics, beceQuestions] =
    await Promise.all([
      prisma.subject.findUnique({
        where: {
          id: subjectId,
        },
        select: {
          id: true,
          name: true,
          isActive: true,
        },
      }),

      prisma.profile.findUnique({
        where: {
          userId: session.user.id,
        },
        select: {
          classLevel: true,
        },
      }),

      prisma.topic.findMany({
        where: {
          subjectId,
        },
        select: {
          id: true,
          name: true,
        },
        orderBy: {
          name: "asc",
        },
      }),

      prisma.question.findMany({
        where: {
          subjectId,
          examType: "BECE",
          status: "PUBLISHED",
          beceYear: {
            not: null,
          },
        },
        select: {
          beceYear: true,
        },
        distinct: ["beceYear"],
        orderBy: {
          beceYear: "desc",
        },
      }),
    ]);

  if (!subject || !subject.isActive) {
    notFound();
  }

  if (!profile?.classLevel) {
    redirect("/dashboard");
  }

  const classLabel =
    classLabels[profile.classLevel] ??
    profile.classLevel;

  const beceYears = beceQuestions
    .map((question) => question.beceYear)
    .filter(
      (year): year is number =>
        typeof year === "number"
    );

  const isJHS =
    profile.classLevel.startsWith("JHS_");

  const selectedDurationLabel =
    durationOptions.find(
      (option) =>
        option.value === selectedDuration
    )?.label ?? "";

  const selectedExamTypeLabel =
    examTypeLabels[selectedExamType] ?? "";

  const selectedBeceYearNumber =
    Number(selectedBeceYear);

  const isValidSelectedBeceYear =
    selectedExamType === "BECE" &&
    Number.isInteger(selectedBeceYearNumber) &&
    beceYears.includes(
      selectedBeceYearNumber
    );

  const selectedTopic = topics.find(
    (topic) =>
      topic.id === selectedTopicId
  );

  const selectedTopicName =
    selectedTopic?.name ?? "";

  const isValidSelectedTopic =
    selectedExamType === "TOPIC_BASED" &&
    Boolean(selectedTopic);

  const validQuestionCounts =
    selectedExamType === "BECE"
      ? ["40"]
      : ["20", "25", "30", "35", "40"];

  const isValidSelectedQuestionCount =
    validQuestionCounts.includes(
      selectedQuestionCount
    );

  const selectedQuestionCountLabel =
    isValidSelectedQuestionCount
      ? `${selectedQuestionCount} questions`
      : "";

  const hasSettings =
    Boolean(selectedDuration) &&
    Boolean(selectedExamType) &&
    isValidSelectedQuestionCount &&
    (selectedExamType !== "BECE" ||
      isValidSelectedBeceYear) &&
    (selectedExamType !== "TOPIC_BASED" ||
      isValidSelectedTopic);

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 lg:px-8">
          <Link
            href="/dashboard"
            className="text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            ← Back to Dashboard
          </Link>

          <div className="mt-4">
            <p className="text-sm font-semibold text-blue-600">
              Student Prep
            </p>

            <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
              Examination Settings
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Configure your examination before
              starting.
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Subject and Class */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Selected Subject
              </p>

              <h2 className="mt-1 text-2xl font-bold text-slate-900">
                {subject.name}
              </h2>
            </div>

            <div className="rounded-xl bg-blue-50 px-5 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                Your Class
              </p>

              <p className="mt-1 font-bold text-blue-900">
                {classLabel}
              </p>
            </div>
          </div>
        </section>

        {/* Main Settings */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900">
              Set Up Your Examination
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Choose the duration, number of questions,
              examination type, and required source.
            </p>
          </div>

          <form
            method="GET"
            action={`/exam/settings/${subjectId}`}
          >
            <div className="grid gap-6 md:grid-cols-2">
              {/* Duration */}
              <div>
                <label
                  htmlFor="duration"
                  className="block text-sm font-semibold text-slate-800"
                >
                  Examination Duration
                </label>

                <select
                  id="duration"
                  name="duration"
                  defaultValue={selectedDuration}
                  required
                  className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="" disabled>
                    Select examination duration
                  </option>

                  {durationOptions.map(
                    (option) => (
                      <option
                        key={option.value}
                        value={option.value}
                      >
                        {option.label}
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* Exam Type */}
              <div>
                <label
                  htmlFor="examType"
                  className="block text-sm font-semibold text-slate-800"
                >
                  Examination Type
                </label>

                <select
                  id="examType"
                  name="examType"
                  defaultValue={selectedExamType}
                  required
                  className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="" disabled>
                    Select examination type
                  </option>

                  {examTypeOptions.map(
                    (option) => (
                      <option
                        key={option.value}
                        value={option.value}
                      >
                        {option.label}
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* Number of Questions */}
              <div>
                <label
                  htmlFor="questionCount"
                  className="block text-sm font-semibold text-slate-800"
                >
                  Number of Questions
                </label>

                <select
                  id="questionCount"
                  name="questionCount"
                  defaultValue={
                    selectedQuestionCount
                  }
                  required
                  className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="" disabled>
                    Select number of questions
                  </option>

                  {selectedExamType === "BECE"
                    ? (
                        <option value="40">
                          40 questions
                        </option>
                      )
                    : questionCountOptions.map(
                        (option) => (
                          <option
                            key={option.value}
                            value={option.value}
                          >
                            {option.label}
                          </option>
                        )
                      )}
                </select>

                {selectedExamType ===
                  "BECE" && (
                  <p className="mt-2 text-xs font-medium text-red-600">
                    BECE examinations contain
                    exactly 40 questions.
                  </p>
                )}

                {selectedExamType !==
                  "BECE" &&
                  selectedExamType && (
                    <p className="mt-2 text-xs text-slate-500">
                      Choose between 20 and 40
                      questions.
                    </p>
                  )}
              </div>
            </div>

            {/* BECE Year */}
            {selectedExamType === "BECE" && (
              <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-5">
                <h3 className="font-bold text-red-900">
                  Select BECE Year
                </h3>

                <p className="mt-1 text-sm text-red-800">
                  Choose the BECE examination year
                  you want to practise.
                </p>

                {!isJHS ? (
                  <div className="mt-4 rounded-lg border border-red-200 bg-white p-4">
                    <p className="text-sm font-semibold text-red-700">
                      BECE examinations are
                      available to JHS students.
                    </p>

                    <p className="mt-1 text-xs text-red-600">
                      Your current class is{" "}
                      {classLabel}.
                    </p>
                  </div>
                ) : beceYears.length ===
                  0 ? (
                  <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
                    <p className="text-sm font-semibold text-slate-700">
                      No BECE years are
                      currently available.
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      There are currently no
                      published BECE questions
                      for this subject.
                    </p>
                  </div>
                ) : (
                  <div className="mt-4">
                    <label
                      htmlFor="beceYear"
                      className="block text-sm font-semibold text-red-900"
                    >
                      BECE Year
                    </label>

                    <select
                      id="beceYear"
                      name="beceYear"
                      defaultValue={
                        selectedBeceYear
                      }
                      required
                      className="mt-2 w-full rounded-lg border border-red-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100"
                    >
                      <option
                        value=""
                        disabled
                      >
                        Select BECE year
                      </option>

                      {beceYears.map(
                        (year) => (
                          <option
                            key={year}
                            value={year}
                          >
                            BECE {year}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* Topic */}
            {selectedExamType ===
              "TOPIC_BASED" && (
              <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-5">
                <h3 className="font-bold text-blue-900">
                  Select Topic
                </h3>

                <p className="mt-1 text-sm text-blue-800">
                  Choose the topic you want to
                  practise.
                </p>

                {topics.length === 0 ? (
                  <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
                    <p className="text-sm font-semibold text-slate-700">
                      No topics are currently
                      available.
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      There are currently no
                      topics configured for this
                      subject.
                    </p>
                  </div>
                ) : (
                  <div className="mt-4">
                    <label
                      htmlFor="topicId"
                      className="block text-sm font-semibold text-blue-900"
                    >
                      Topic
                    </label>

                    <select
                      id="topicId"
                      name="topicId"
                      defaultValue={
                        selectedTopicId
                      }
                      required
                      className="mt-2 w-full rounded-lg border border-blue-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    >
                      <option
                        value=""
                        disabled
                      >
                        Select topic
                      </option>

                      {topics.map(
                        (topic) => (
                          <option
                            key={topic.id}
                            value={topic.id}
                          >
                            {topic.name}
                          </option>
                        )
                      )}
                    </select>

                    <p className="mt-2 text-xs text-blue-700">
                      {topics.length.toLocaleString()}{" "}
                      topics available.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Continue */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href="/dashboard"
                className="rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </Link>

              <button
                type="submit"
                className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Continue
              </button>
            </div>
          </form>
        </section>

        {/* Selected Settings */}
        {hasSettings && (
          <section className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-6">
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="text-lg font-bold text-green-900">
                  Examination Settings Selected
                </h2>

                <p className="mt-1 text-sm text-green-800">
                  Your examination is ready to
                  begin.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-green-700">
                  {selectedDurationLabel}
                </span>

                <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-green-700">
                  {selectedQuestionCountLabel}
                </span>

                <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-green-700">
                  {selectedExamTypeLabel}
                </span>

                {selectedExamType ===
                  "BECE" &&
                  isValidSelectedBeceYear && (
                    <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-green-700">
                      BECE{" "}
                      {selectedBeceYearNumber}
                    </span>
                  )}

                {isValidSelectedTopic && (
                  <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-green-700">
                    {selectedTopicName}
                  </span>
                )}
              </div>

              <div className="border-t border-green-200 pt-5">
                <p className="mb-3 text-sm font-medium text-green-800">
                  Everything is ready. Click below
                  to enter your examination.
                </p>

                <StartExamButton
                  subjectId={subjectId}
                  duration={selectedDuration}
                  examType={selectedExamType}
                  questionCount={
                    selectedQuestionCount
                  }
                  topicId={
                    selectedExamType ===
                    "TOPIC_BASED"
                      ? selectedTopicId
                      : undefined
                  }
                  beceYear={
                    selectedExamType ===
                    "BECE"
                      ? selectedBeceYear
                      : undefined
                  }
                />
              </div>
            </div>
          </section>
        )}

        {/* Available Sources */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">
            Available Examination Sources
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Question sources available for your
            class and subject.
          </p>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {/* Likely */}
            <div className="rounded-xl border border-green-200 bg-green-50 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 font-bold text-green-700">
                ✓
              </div>

              <h3 className="mt-4 font-bold text-green-900">
                {examTypeLabels.LIKELY}
              </h3>

              <p className="mt-2 text-sm text-green-800">
                Questions selected for your
                class level.
              </p>

              <p className="mt-3 text-xs font-semibold text-green-700">
                Class: {classLabel}
              </p>
            </div>

            {/* Topic Based */}
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 font-bold text-blue-700">
                ?
              </div>

              <h3 className="mt-4 font-bold text-blue-900">
                {examTypeLabels.TOPIC_BASED}
              </h3>

              <p className="mt-2 text-sm text-blue-800">
                Choose a topic and practise
                questions from it.
              </p>

              <p className="mt-3 text-xs font-semibold text-blue-700">
                {topics.length.toLocaleString()}{" "}
                topics available
              </p>
            </div>

            {/* BECE */}
            <div
              className={`rounded-xl border p-5 ${
                isJHS &&
                beceYears.length > 0
                  ? "border-red-200 bg-red-50"
                  : "border-slate-200 bg-slate-50"
              }`}
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg font-bold ${
                  isJHS &&
                  beceYears.length > 0
                    ? "bg-red-100 text-red-700"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                B
              </div>

              <h3
                className={`mt-4 font-bold ${
                  isJHS &&
                  beceYears.length > 0
                    ? "text-red-900"
                    : "text-slate-700"
                }`}
              >
                {examTypeLabels.BECE}
              </h3>

              <p
                className={`mt-2 text-sm ${
                  isJHS &&
                  beceYears.length > 0
                    ? "text-red-800"
                    : "text-slate-500"
                }`}
              >
                Select questions from a
                specific BECE year.
              </p>

              <p
                className={`mt-3 text-xs font-semibold ${
                  isJHS &&
                  beceYears.length > 0
                    ? "text-red-700"
                    : "text-slate-500"
                }`}
              >
                {isJHS
                  ? `${beceYears.length} BECE year${
                      beceYears.length ===
                      1
                        ? ""
                        : "s"
                    } available`
                  : "Available for JHS students"}
              </p>
            </div>
          </div>
        </section>

        {/* Topics */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">
            Topics Available
          </h2>

          {topics.length === 0 ? (
            <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
              No topics are currently
              available for this subject.
            </p>
          ) : (
            <div className="mt-4 flex flex-wrap gap-2">
              {topics.map((topic) => (
                <span
                  key={topic.id}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
                >
                  {topic.name}
                </span>
              ))}
            </div>
          )}
        </section>

        {/* BECE Years */}
        {isJHS && (
          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">
              BECE Years Available
            </h2>

            {beceYears.length === 0 ? (
              <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                No published BECE questions
                are currently available for
                this subject.
              </p>
            ) : (
              <div className="mt-4 flex flex-wrap gap-3">
                {beceYears.map(
                  (year) => (
                    <span
                      key={year}
                      className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700"
                    >
                      BECE {year}
                    </span>
                  )
                )}
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}