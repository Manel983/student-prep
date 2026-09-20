"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

interface Topic {
  id: string;
  name: string;
}

interface Subject {
  id: string;
  name: string;
  topics: Topic[];
}

interface QuestionData {
  id: string;
  subjectId: string;
  topicId: string | null;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
  explanation: string | null;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  marks: number;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
}

interface EditQuestionFormProps {
  question: QuestionData;
  subjects: Subject[];
}

export default function EditQuestionForm({
  question,
  subjects,
}: EditQuestionFormProps) {
  const router = useRouter();

  const [subjectId, setSubjectId] = useState(question.subjectId);
  const [topicId, setTopicId] = useState(question.topicId ?? "");
  const [questionText, setQuestionText] = useState(question.questionText);

  const [optionA, setOptionA] = useState(question.optionA);
  const [optionB, setOptionB] = useState(question.optionB);
  const [optionC, setOptionC] = useState(question.optionC);
  const [optionD, setOptionD] = useState(question.optionD);

  const [correctAnswer, setCorrectAnswer] = useState(
    question.correctAnswer
  );

  const [difficulty, setDifficulty] = useState(question.difficulty);
  const [marks, setMarks] = useState(String(question.marks));

  const [status, setStatus] = useState(question.status);

  const [explanation, setExplanation] = useState(
    question.explanation ?? ""
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Get topics for selected subject
  const selectedSubject = useMemo(
    () => subjects.find((subject) => subject.id === subjectId),
    [subjects, subjectId]
  );

  const topics = selectedSubject?.topics ?? [];

  function handleSubjectChange(value: string) {
    setSubjectId(value);

    // Reset topic when subject changes
    setTopicId("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/admin/questions/${question.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subjectId,
          topicId: topicId || null,
          questionText,
          optionA,
          optionB,
          optionC,
          optionD,
          correctAnswer,
          difficulty,
          marks: Number(marks),
          status,
          explanation,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(
          data.message || "Unable to update the question."
        );
        return;
      }

      setSuccess("Question updated successfully.");

      // Refresh the page data
      router.refresh();

      // Give the user a moment to see the success message
      setTimeout(() => {
        router.push("/admin/questions");
      }, 800);
    } catch {
      setError(
        "Unable to update the question. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Messages */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
          {success}
        </div>
      )}

      {/* Basic Information */}
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h2 className="text-lg font-bold text-slate-900">
          Question Information
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Select the subject, topic and difficulty level.
        </p>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {/* Subject */}
          <div>
            <label
              htmlFor="subject"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Subject
            </label>

            <select
              id="subject"
              value={subjectId}
              onChange={(e) => handleSubjectChange(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">Select subject</option>

              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>

          {/* Topic */}
          <div>
            <label
              htmlFor="topic"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Topic
            </label>

            <select
              id="topic"
              value={topicId}
              onChange={(e) => setTopicId(e.target.value)}
              disabled={!subjectId || topics.length === 0}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
            >
              <option value="">
                {topics.length === 0
                  ? "No topics available"
                  : "Select topic (optional)"}
              </option>

              {topics.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {topic.name}
                </option>
              ))}
            </select>
          </div>

          {/* Difficulty */}
          <div>
            <label
              htmlFor="difficulty"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Difficulty
            </label>

            <select
              id="difficulty"
              value={difficulty}
              onChange={(e) =>
                setDifficulty(
                  e.target.value as "EASY" | "MEDIUM" | "HARD"
                )
              }
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="EASY">Easy</option>
              <option value="MEDIUM">Medium</option>
              <option value="HARD">Hard</option>
            </select>
          </div>

          {/* Marks */}
          <div>
            <label
              htmlFor="marks"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Marks
            </label>

            <input
              id="marks"
              type="number"
              min="1"
              max="100"
              value={marks}
              onChange={(e) => setMarks(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>
      </section>

      {/* Question */}
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h2 className="text-lg font-bold text-slate-900">
          Question
        </h2>

        <div className="mt-5">
          <label
            htmlFor="questionText"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Question Text
          </label>

          <textarea
            id="questionText"
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            required
            rows={5}
            className="w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm leading-6 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            placeholder="Enter the question..."
          />
        </div>
      </section>

      {/* Answer Options */}
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h2 className="text-lg font-bold text-slate-900">
          Answer Options
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Enter all four possible answers and select the correct one.
        </p>

        <div className="mt-6 space-y-5">
          {/* Option A */}
          <div>
            <label
              htmlFor="optionA"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Option A
            </label>

            <input
              id="optionA"
              type="text"
              value={optionA}
              onChange={(e) => setOptionA(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Option B */}
          <div>
            <label
              htmlFor="optionB"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Option B
            </label>

            <input
              id="optionB"
              type="text"
              value={optionB}
              onChange={(e) => setOptionB(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Option C */}
          <div>
            <label
              htmlFor="optionC"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Option C
            </label>

            <input
              id="optionC"
              type="text"
              value={optionC}
              onChange={(e) => setOptionC(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Option D */}
          <div>
            <label
              htmlFor="optionD"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Option D
            </label>

            <input
              id="optionD"
              type="text"
              value={optionD}
              onChange={(e) => setOptionD(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        {/* Correct Answer */}
        <div className="mt-6">
          <label
            htmlFor="correctAnswer"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Correct Answer
          </label>

          <select
            id="correctAnswer"
            value={correctAnswer}
            onChange={(e) => setCorrectAnswer(e.target.value)}
            required
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
            <option value="D">D</option>
          </select>
        </div>
      </section>

      {/* Explanation */}
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h2 className="text-lg font-bold text-slate-900">
          Explanation
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Optional explanation shown when students review their mistakes.
        </p>

        <div className="mt-5">
          <textarea
            id="explanation"
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            rows={5}
            className="w-full resize-y rounded-xl border border-slate-300 px-4 py-3 text-sm leading-6 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            placeholder="Explain why the correct answer is correct..."
          />
        </div>
      </section>

      {/* Publication Status */}
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h2 className="text-lg font-bold text-slate-900">
          Publication Status
        </h2>

        <div className="mt-5">
          <label
            htmlFor="status"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Status
          </label>

          <select
            id="status"
            value={status}
            onChange={(e) =>
              setStatus(
                e.target.value as
                  | "DRAFT"
                  | "PUBLISHED"
                  | "ARCHIVED"
              )
            }
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
      </section>

      {/* Buttons */}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={() => router.push("/admin/questions")}
          disabled={loading}
          className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Saving Changes..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}