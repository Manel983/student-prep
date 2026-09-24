"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface Question {
  id: string;
  questionNo: number;
  marks: number;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
}

interface ExamClientProps {
  exam: {
    id: string;
    title: string;
    durationMinutes: number;
    totalQuestions: number;
    startedAt: string;
    expiresAt: string;
    subject: {
      name: string;
    };
    questions: Question[];
  };
}

export default function ExamClient({ exam }: ExamClientProps) {
  const router = useRouter();

  const storageKey = `student-prep-exam-${exam.id}`;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isRestored, setIsRestored] = useState(false);

  const [secondsLeft, setSecondsLeft] = useState(() =>
    Math.max(
      0,
      Math.floor(
        (new Date(exam.expiresAt).getTime() - Date.now()) / 1000
      )
    )
  );

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const submissionStartedRef = useRef(false);

  const currentQuestion = exam.questions[currentIndex];

  /*
   * Restore the student's answers and current question
   * when returning to the exam page.
   */
  useEffect(() => {
    try {
      const savedExamState = window.localStorage.getItem(storageKey);

      if (savedExamState) {
        const parsed = JSON.parse(savedExamState);

        if (
          parsed &&
          typeof parsed === "object" &&
          typeof parsed.answers === "object"
        ) {
          const validQuestionIds = new Set(
            exam.questions.map((question) => question.id)
          );

          const restoredAnswers: Record<string, string> = {};

          for (const [questionId, answer] of Object.entries(
            parsed.answers
          )) {
            if (
              validQuestionIds.has(questionId) &&
              typeof answer === "string" &&
              ["A", "B", "C", "D"].includes(answer)
            ) {
              restoredAnswers[questionId] = answer;
            }
          }

          setAnswers(restoredAnswers);

          if (
            typeof parsed.currentIndex === "number" &&
            Number.isInteger(parsed.currentIndex) &&
            parsed.currentIndex >= 0 &&
            parsed.currentIndex < exam.questions.length
          ) {
            setCurrentIndex(parsed.currentIndex);
          }
        }
      }
    } catch (error) {
      console.error(
        "Unable to restore exam progress:",
        error
      );
    } finally {
      setIsRestored(true);
    }
  }, [exam.questions, storageKey]);

  /*
   * Save answers and current question locally.
   * The storage key is unique to this examination.
   */
  useEffect(() => {
    if (!isRestored || submitting) {
      return;
    }

    try {
      window.localStorage.setItem(
        storageKey,
        JSON.stringify({
          answers,
          currentIndex,
        })
      );
    } catch (error) {
      console.error(
        "Unable to save exam progress:",
        error
      );
    }
  }, [
    answers,
    currentIndex,
    isRestored,
    storageKey,
    submitting,
  ]);

  const answeredCount = useMemo(
    () => Object.keys(answers).length,
    [answers]
  );

  const progressPercentage =
    exam.questions.length > 0
      ? ((currentIndex + 1) / exam.questions.length) * 100
      : 0;

  useEffect(() => {
    const expiresAtMs = new Date(exam.expiresAt).getTime();

    function updateTimer() {
      const remaining = Math.max(
        0,
        Math.floor((expiresAtMs - Date.now()) / 1000)
      );

      setSecondsLeft(remaining);

      if (remaining <= 0) {
        clearInterval(timer);
      }
    }

    updateTimer();

    const timer = setInterval(updateTimer, 1000);

    return () => clearInterval(timer);
  }, [exam.expiresAt]);

  useEffect(() => {
    if (
      isRestored &&
      secondsLeft <= 0 &&
      !submissionStartedRef.current
    ) {
      submitExam(true);
    }
  }, [secondsLeft, isRestored]);

  function selectAnswer(answer: string) {
    if (
      submitting ||
      secondsLeft <= 0 ||
      !currentQuestion
    ) {
      return;
    }

    setAnswers((current) => ({
      ...current,
      [currentQuestion.id]: answer,
    }));

    setError("");
  }

  function goToPrevious() {
    if (submitting || secondsLeft <= 0) {
      return;
    }

    if (currentIndex > 0) {
      setCurrentIndex((current) => current - 1);
    }
  }

  function goToNext() {
    if (submitting || secondsLeft <= 0) {
      return;
    }

    if (currentIndex < exam.questions.length - 1) {
      setCurrentIndex((current) => current + 1);
    }
  }

  async function submitExam(autoSubmit = false) {
    if (submissionStartedRef.current) {
      return;
    }

    submissionStartedRef.current = true;
    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/exams/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          examId: exam.id,
          answers,
          autoSubmit,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        submissionStartedRef.current = false;
        setSubmitting(false);

        setError(
          data.message ||
            "Unable to submit your test. Please try again."
        );

        return;
      }

      /*
       * The exam has now been successfully submitted.
       * Remove only this exam's temporary browser state.
       */
      try {
        window.localStorage.removeItem(storageKey);
      } catch (error) {
        console.error(
          "Unable to clear saved exam progress:",
          error
        );
      }

      router.push(`/results/${data.result.id}`);
      router.refresh();
    } catch {
      submissionStartedRef.current = false;
      setSubmitting(false);

      setError(
        "Unable to submit your test. Please check your connection and try again."
      );
    }
  }

  function handleSubmitClick() {
    if (
      submitting ||
      secondsLeft <= 0
    ) {
      return;
    }

    const unanswered =
      exam.questions.length - answeredCount;

    const message =
      unanswered > 0
        ? `You have ${unanswered} unanswered question${
            unanswered === 1 ? "" : "s"
          }. Are you sure you want to submit?`
        : "Are you sure you want to submit your test?";

    if (window.confirm(message)) {
      submitExam(false);
    }
  }

  function formatTime(totalSeconds: number) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(
      seconds
    ).padStart(2, "0")}`;
  }

  if (!currentQuestion) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-2xl">
            !
          </div>

          <h1 className="mt-5 text-xl font-bold text-slate-900">
            No questions found
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            This exam does not contain any questions.
          </p>
        </div>
      </main>
    );
  }

  const timeExpired = secondsLeft <= 0;
  const isLowTime = secondsLeft <= 300 && !timeExpired;
  const selectedAnswer = answers[currentQuestion.id];

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <img
                src="/logo.jpg"
                alt="Student Prep"
                className="h-8 w-auto shrink-0 object-contain"
              />

              <p className="truncate text-sm font-semibold text-blue-600">
                {exam.subject.name}
              </p>
            </div>

            <h1 className="mt-2 truncate text-lg font-bold text-slate-900 sm:text-xl">
              {exam.title}
            </h1>
          </div>

          {/* Timer */}
          <div
            className={`shrink-0 rounded-xl border px-4 py-2.5 text-center shadow-sm ${
              timeExpired
                ? "border-red-300 bg-red-50 text-red-700"
                : isLowTime
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-blue-200 bg-blue-50 text-blue-700"
            }`}
          >
            <p className="text-[10px] font-bold uppercase tracking-wider">
              {timeExpired ? "Time Expired" : "Time Left"}
            </p>

            <p className="mt-0.5 text-xl font-bold tabular-nums sm:text-2xl">
              {formatTime(secondsLeft)}
            </p>
          </div>
        </div>

        {/* Progress */}
        <div className="h-1.5 bg-slate-100">
          <div
            className="h-1.5 bg-blue-600 transition-all duration-300"
            style={{
              width: `${progressPercentage}%`,
            }}
          />
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[1fr_280px] lg:px-8">
        {/* Main Question Area */}
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="p-5 sm:p-8">
            {/* Question metadata */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-blue-100 px-3 py-1.5 text-sm font-bold text-blue-700">
                  Question {currentIndex + 1}
                </span>

                <span className="text-sm text-slate-400">
                  of {exam.questions.length}
                </span>
              </div>

              <span className="rounded-full bg-green-50 px-3 py-1.5 text-sm font-semibold text-green-700">
                {currentQuestion.marks} mark
                {currentQuestion.marks === 1 ? "" : "s"}
              </span>
            </div>

            {/* Question */}
            <div className="mt-7">
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                Question {currentQuestion.questionNo}
              </p>

              <h2 className="text-xl font-bold leading-8 text-slate-900 sm:text-2xl">
                {currentQuestion.questionText}
              </h2>
            </div>

            {/* Options */}
            <div className="mt-8 space-y-3">
              {[
                {
                  key: "A",
                  text: currentQuestion.optionA,
                },
                {
                  key: "B",
                  text: currentQuestion.optionB,
                },
                {
                  key: "C",
                  text: currentQuestion.optionC,
                },
                {
                  key: "D",
                  text: currentQuestion.optionD,
                },
              ].map((option) => {
                const selected =
                  selectedAnswer === option.key;

                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => selectAnswer(option.key)}
                    disabled={submitting || timeExpired}
                    className={`group flex w-full items-start gap-4 rounded-xl border p-4 text-left transition ${
                      selected
                        ? "border-blue-600 bg-blue-50 ring-2 ring-blue-100"
                        : "border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/40"
                    } disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-sm font-bold transition ${
                        selected
                          ? "border-blue-600 bg-blue-600 text-white"
                          : "border-slate-300 bg-white text-slate-700 group-hover:border-blue-400 group-hover:text-blue-700"
                      }`}
                    >
                      {option.key}
                    </span>

                    <span
                      className={`pt-1 text-sm leading-6 sm:text-base ${
                        selected
                          ? "font-medium text-blue-900"
                          : "text-slate-700"
                      }`}
                    >
                      {option.text}
                    </span>

                    {selected && (
                      <span className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-600 text-xs font-bold text-white">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Auto-submit message */}
            {timeExpired && submitting && (
              <div className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-600 text-xs text-white">
                  !
                </span>

                <span>
                  Time is up. Your test is being submitted automatically...
                </span>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-100 font-bold text-red-700">
                  !
                </span>

                <span>{error}</span>
              </div>
            )}

            {/* Navigation */}
            <div className="mt-8 flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={goToPrevious}
                disabled={
                  currentIndex === 0 ||
                  submitting ||
                  timeExpired
                }
                className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                ← Previous
              </button>

              <div className="text-center text-xs font-medium text-slate-500">
                {answeredCount} of {exam.questions.length} answered
              </div>

              {currentIndex < exam.questions.length - 1 ? (
                <button
                  type="button"
                  onClick={goToNext}
                  disabled={submitting || timeExpired}
                  className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next →
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmitClick}
                  disabled={submitting || timeExpired}
                  className="rounded-xl bg-green-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? "Submitting..." : "Submit Test"}
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Question Navigator */}
        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-24">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900">
                Questions
              </h3>

              <p className="mt-1 text-xs text-slate-500">
                Navigate through the test
              </p>
            </div>

            <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-bold text-green-700">
              {answeredCount}/{exam.questions.length}
            </span>
          </div>

          <div className="mt-5 grid grid-cols-5 gap-2">
            {exam.questions.map((question, index) => {
              const answered = Boolean(answers[question.id]);
              const active = index === currentIndex;

              return (
                <button
                  key={question.id}
                  type="button"
                  onClick={() => {
                    if (!submitting && !timeExpired) {
                      setCurrentIndex(index);
                    }
                  }}
                  disabled={submitting || timeExpired}
                  className={`h-10 rounded-lg text-sm font-bold transition ${
                    active
                      ? "bg-blue-600 text-white shadow-sm ring-2 ring-blue-200"
                      : answered
                        ? "border border-green-200 bg-green-100 text-green-700 hover:bg-green-200"
                        : "border border-slate-200 bg-slate-100 text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                  } disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-6 space-y-2.5 border-t border-slate-100 pt-5 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded bg-blue-600" />
              Current question
            </div>

            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded bg-green-100 ring-1 ring-green-200" />
              Answered
            </div>

            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded bg-slate-100 ring-1 ring-slate-200" />
              Unanswered
            </div>
          </div>

          {/* Submit */}
          <button
            type="button"
            onClick={handleSubmitClick}
            disabled={submitting || timeExpired}
            className="mt-6 w-full rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit Test"}
          </button>

          <p className="mt-3 text-center text-[11px] leading-4 text-slate-400">
            Make sure you have reviewed your answers before submitting.
          </p>
        </aside>
      </div>
    </main>
  );
}