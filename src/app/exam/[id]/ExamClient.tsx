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

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

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

  // Prevent multiple automatic/manual submissions.
  const submissionStartedRef = useRef(false);

  const currentQuestion = exam.questions[currentIndex];

  const answeredCount = useMemo(
    () => Object.keys(answers).length,
    [answers]
  );

  const progressPercentage =
    exam.questions.length > 0
      ? ((currentIndex + 1) / exam.questions.length) * 100
      : 0;

  /*
   * Countdown timer
   *
   * The timer is calculated from the original server-provided
   * expiresAt value on every tick. It is NOT based on a local
   * countdown that can be reset by refreshing the page.
   */
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

  /*
   * Automatically submit when the timer reaches zero.
   */
  useEffect(() => {
    if (secondsLeft <= 0 && !submissionStartedRef.current) {
      submitExam(true);
    }
  }, [secondsLeft]);

  function selectAnswer(answer: string) {
    if (submitting || secondsLeft <= 0) return;

    setAnswers((current) => ({
      ...current,
      [currentQuestion.id]: answer,
    }));

    setError("");
  }

  function goToPrevious() {
    if (submitting || secondsLeft <= 0) return;

    if (currentIndex > 0) {
      setCurrentIndex((current) => current - 1);
    }
  }

  function goToNext() {
    if (submitting || secondsLeft <= 0) return;

    if (currentIndex < exam.questions.length - 1) {
      setCurrentIndex((current) => current + 1);
    }
  }

  async function submitExam(autoSubmit = false) {
    /*
     * This ref is more reliable than checking only React state.
     * It prevents manual submission + automatic submission from
     * happening at the same time.
     */
    if (submissionStartedRef.current) return;

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
        /*
         * If the server rejects the submission, allow another
         * attempt instead of permanently locking the student.
         */
        submissionStartedRef.current = false;
        setSubmitting(false);

        setError(
          data.message ||
            "Unable to submit your test. Please try again."
        );

        return;
      }

      /*
       * Submission was successful.
       * Send the student directly to the result belonging to
       * this exam.
       */
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
    if (submitting || secondsLeft <= 0) return;

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
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
          <h1 className="text-xl font-bold text-slate-900">
            No questions found
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            This exam does not contain any questions.
          </p>
        </div>
      </main>
    );
  }

  const timeExpired = secondsLeft <= 0;

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <p className="text-sm font-medium text-blue-600">
              {exam.subject.name}
            </p>

            <h1 className="text-lg font-bold text-slate-900 sm:text-xl">
              {exam.title}
            </h1>
          </div>

          <div
            className={`rounded-xl px-4 py-2 text-center ${
              timeExpired || secondsLeft <= 300
                ? "bg-red-50 text-red-700"
                : "bg-blue-50 text-blue-700"
            }`}
          >
            <p className="text-xs font-medium uppercase tracking-wide">
              {timeExpired ? "Time Expired" : "Time Left"}
            </p>

            <p className="text-xl font-bold tabular-nums">
              {formatTime(secondsLeft)}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-slate-100">
          <div
            className="h-1 bg-blue-600 transition-all"
            style={{
              width: `${progressPercentage}%`,
            }}
          />
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[1fr_280px] lg:px-8">
        {/* Main Question Area */}
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
              Question {currentIndex + 1} of{" "}
              {exam.questions.length}
            </span>

            <span className="text-sm font-medium text-slate-500">
              {currentQuestion.marks} mark
              {currentQuestion.marks === 1 ? "" : "s"}
            </span>
          </div>

          <h2 className="mt-6 text-xl font-bold leading-8 text-slate-900 sm:text-2xl">
            {currentQuestion.questionText}
          </h2>

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
                answers[currentQuestion.id] === option.key;

              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => selectAnswer(option.key)}
                  disabled={submitting || timeExpired}
                  className={`flex w-full items-start gap-4 rounded-xl border p-4 text-left transition ${
                    selected
                      ? "border-blue-600 bg-blue-50 ring-2 ring-blue-100"
                      : "border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50"
                  } disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm font-bold ${
                      selected
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-slate-300 bg-white text-slate-700"
                    }`}
                  >
                    {option.key}
                  </span>

                  <span className="pt-1 text-sm leading-6 text-slate-700 sm:text-base">
                    {option.text}
                  </span>
                </button>
              );
            })}
          </div>

          {timeExpired && submitting && (
            <div className="mt-6 rounded-xl bg-amber-50 p-4 text-sm font-semibold text-amber-800">
              Time is up. Your test is being submitted automatically...
            </div>
          )}

          {error && (
            <div className="mt-6 rounded-xl bg-red-50 p-4 text-sm font-medium text-red-700">
              {error}
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
              className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              ← Previous
            </button>

            {currentIndex < exam.questions.length - 1 ? (
              <button
                type="button"
                onClick={goToNext}
                disabled={submitting || timeExpired}
                className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next →
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmitClick}
                disabled={submitting || timeExpired}
                className="rounded-xl bg-green-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Submit Test"}
              </button>
            )}
          </div>
        </section>

        {/* Question Navigator */}
        <aside className="h-fit rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 lg:sticky lg:top-24">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900">
              Questions
            </h3>

            <span className="text-xs font-medium text-slate-500">
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
                      ? "bg-blue-600 text-white ring-2 ring-blue-200"
                      : answered
                      ? "bg-green-100 text-green-700"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  } disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>

          <div className="mt-6 space-y-2 text-xs text-slate-500">
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

          <button
            type="button"
            onClick={handleSubmitClick}
            disabled={submitting || timeExpired}
            className="mt-6 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit Test"}
          </button>
        </aside>
      </div>
    </main>
  );
}