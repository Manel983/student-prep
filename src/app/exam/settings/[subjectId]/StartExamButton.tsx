"use client";

import { useState } from "react";

interface StartExamButtonProps {
  subjectId: string;
  duration: string;
  examType: string;
  questionCount: string;
  topicId?: string;
  beceYear?: string;
}

export default function StartExamButton({
  subjectId,
  duration,
  examType,
  questionCount,
  topicId,
  beceYear,
}: StartExamButtonProps) {
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState("");

  async function handleStartExam() {
    setIsStarting(true);
    setError("");

    try {
      const creationKey = crypto.randomUUID();

      const response = await fetch("/api/exams/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subjectId,
          duration: Number(duration),
          examType,
          questionCount: Number(questionCount),
          ...(topicId ? { topicId } : {}),
          ...(beceYear ? { beceYear: Number(beceYear) } : {}),
          creationKey,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message ||
            "Unable to start the examination."
        );
        return;
      }

      if (!data.exam?.id) {
        setError(
          "The examination was created, but no exam ID was returned."
        );
        return;
      }

      window.location.href = `/exam/${data.exam.id}`;
    } catch (error) {
      console.error(
        "Start examination error:",
        error
      );

      setError(
        "An unexpected error occurred while starting the examination."
      );
    } finally {
      setIsStarting(false);
    }
  }

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={handleStartExam}
        disabled={isStarting}
        className="w-full rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isStarting
          ? "Preparing Examination..."
          : "Start Examination"}
      </button>

      {error && (
        <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-700">
            {error}
          </p>
        </div>
      )}
    </div>
  );
}