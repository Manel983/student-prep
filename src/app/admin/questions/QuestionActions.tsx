"use client";

import { useState } from "react";
import Link from "next/link";

interface QuestionActionsProps {
  question: {
    id: string;
    questionText: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    correctAnswer: string;
    explanation: string | null;
    difficulty: string;
    marks: number;
    status: string;
    subjectName: string;
    topicName: string;
  };
}

export default function QuestionActions({
  question,
}: QuestionActionsProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleDelete() {
    const confirmed = window.confirm(
      "Are you sure you want to delete this question?\n\n" +
        "If this question has already been used in an exam, it will be archived instead of permanently deleted."
    );

    if (!confirmed) {
      return;
    }

    setDeleting(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(
        `/api/admin/questions/${question.id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || "Unable to delete the question.");
        return;
      }

      setMessage(data.message || "Question processed successfully.");

      // Refresh the server-rendered Question Bank.
      window.location.reload();
    } catch {
      setError(
        "A network error occurred. Please try again."
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {/* Preview */}
        <button
          type="button"
          onClick={() => setShowPreview(true)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          Preview
        </button>

        {/* Edit */}
        <Link
          href={`/admin/questions/${question.id}`}
          className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
        >
          Edit
        </Link>

        {/* Delete / Archive */}
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {deleting ? "Processing..." : "Delete"}
        </button>
      </div>

      {/* Error message */}
      {error && (
        <p className="mt-2 max-w-xs text-xs font-medium text-red-600">
          {error}
        </p>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
          onClick={() => setShowPreview(false)}
        >
          <div
            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <p className="text-sm font-medium text-blue-600">
                  Question Preview
                </p>

                <h2 className="mt-1 text-xl font-bold text-slate-900">
                  {question.subjectName}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {question.topicName}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowPreview(false)}
                className="rounded-lg px-3 py-2 text-xl font-semibold text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close preview"
              >
                ×
              </button>
            </div>

            {/* Question */}
            <div className="space-y-6 p-6">
              <div>
                <div className="mb-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    {question.difficulty}
                  </span>

                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                    {question.marks}{" "}
                    {question.marks === 1 ? "mark" : "marks"}
                  </span>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      question.status === "PUBLISHED"
                        ? "bg-green-50 text-green-700"
                        : question.status === "DRAFT"
                        ? "bg-amber-50 text-amber-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {question.status}
                  </span>
                </div>

                <h3 className="text-lg font-semibold leading-7 text-slate-900">
                  {question.questionText}
                </h3>
              </div>

              {/* Options */}
              <div className="space-y-3">
                <Option
                  letter="A"
                  text={question.optionA}
                  correct={question.correctAnswer === "A"}
                />

                <Option
                  letter="B"
                  text={question.optionB}
                  correct={question.correctAnswer === "B"}
                />

                <Option
                  letter="C"
                  text={question.optionC}
                  correct={question.correctAnswer === "C"}
                />

                <Option
                  letter="D"
                  text={question.optionD}
                  correct={question.correctAnswer === "D"}
                />
              </div>

              {/* Explanation */}
              {question.explanation && (
                <div className="rounded-xl bg-blue-50 p-4 ring-1 ring-blue-100">
                  <p className="text-sm font-bold text-blue-900">
                    Explanation
                  </p>

                  <p className="mt-2 text-sm leading-6 text-blue-800">
                    {question.explanation}
                  </p>
                </div>
              )}

              {/* Preview notice */}
              <div className="rounded-xl bg-amber-50 p-4 ring-1 ring-amber-100">
                <p className="text-xs font-medium leading-5 text-amber-800">
                  Admin preview: the correct answer is highlighted here.
                  Correct answers are never exposed to students during an
                  active examination.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Close
              </button>

              <Link
                href={`/admin/questions/${question.id}`}
                className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Edit Question
              </Link>
            </div>
          </div>
        </div>
      )}

      {message && (
        <p className="mt-2 text-xs font-medium text-green-600">
          {message}
        </p>
      )}
    </>
  );
}

function Option({
  letter,
  text,
  correct,
}: {
  letter: string;
  text: string;
  correct: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        correct
          ? "border-green-300 bg-green-50"
          : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${
            correct
              ? "bg-green-600 text-white"
              : "bg-slate-100 text-slate-700"
          }`}
        >
          {letter}
        </span>

        <div className="flex-1">
          <p className="text-sm leading-6 text-slate-800">
            {text}
          </p>

          {correct && (
            <p className="mt-1 text-xs font-bold text-green-700">
              ✓ Correct Answer
            </p>
          )}
        </div>
      </div>
    </div>
  );
}