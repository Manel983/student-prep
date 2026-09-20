"use client";

import { FormEvent, useEffect, useState } from "react";

interface SubjectOption {
  id: string;
  name: string;
}

interface TopicOption {
  id: string;
  name: string;
  subjectId: string;
}

interface CreateQuestionFormProps {
  subjects: SubjectOption[];
  topics: TopicOption[];
}

export default function CreateQuestionForm({
  subjects,
  topics,
}: CreateQuestionFormProps) {
  const [isOpen, setIsOpen] = useState(false);

  const [subjectId, setSubjectId] = useState("");
  const [topicId, setTopicId] = useState("");

  const [questionText, setQuestionText] = useState("");
  const [optionA, setOptionA] = useState("");
  const [optionB, setOptionB] = useState("");
  const [optionC, setOptionC] = useState("");
  const [optionD, setOptionD] = useState("");

  const [correctAnswer, setCorrectAnswer] = useState("A");
  const [explanation, setExplanation] = useState("");
  const [difficulty, setDifficulty] = useState("MEDIUM");
  const [marks, setMarks] = useState("1");
  const [status, setStatus] = useState("DRAFT");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredTopics = topics.filter(
    (topic) => topic.subjectId === subjectId
  );

  useEffect(() => {
    if (
      topicId &&
      !filteredTopics.some((topic) => topic.id === topicId)
    ) {
      setTopicId("");
    }
  }, [subjectId, topicId, filteredTopics]);

  function resetForm() {
    setSubjectId("");
    setTopicId("");
    setQuestionText("");
    setOptionA("");
    setOptionB("");
    setOptionC("");
    setOptionD("");
    setCorrectAnswer("A");
    setExplanation("");
    setDifficulty("MEDIUM");
    setMarks("1");
    setStatus("DRAFT");
    setMessage("");
    setError("");
  }

  function openForm() {
    resetForm();
    setIsOpen(true);
  }

  function closeForm() {
    if (!isSubmitting) {
      setIsOpen(false);
      resetForm();
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setError("");

    if (!subjectId) {
      setError("Please select a subject.");
      return;
    }

    if (!questionText.trim()) {
      setError("Question text is required.");
      return;
    }

    if (!optionA.trim()) {
      setError("Option A is required.");
      return;
    }

    if (!optionB.trim()) {
      setError("Option B is required.");
      return;
    }

    if (!optionC.trim()) {
      setError("Option C is required.");
      return;
    }

    if (!optionD.trim()) {
      setError("Option D is required.");
      return;
    }

    const parsedMarks = Number(marks);

    if (
      !Number.isInteger(parsedMarks) ||
      parsedMarks < 1 ||
      parsedMarks > 100
    ) {
      setError("Marks must be a whole number between 1 and 100.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subjectId,
          topicId,
          questionText: questionText.trim(),
          optionA: optionA.trim(),
          optionB: optionB.trim(),
          optionC: optionC.trim(),
          optionD: optionD.trim(),
          correctAnswer,
          explanation: explanation.trim(),
          difficulty,
          marks: parsedMarks,
          status,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to create question.");
        return;
      }

      setMessage("Question created successfully.");

      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch {
      setError(
        "Unable to create the question. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openForm}
        className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
      >
        + Create Question
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 p-4">
          <div className="mx-auto my-8 w-full max-w-3xl rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">
                  Create Question
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Add a new question to the examination question
                  bank.
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                disabled={isSubmitting}
                className="rounded-lg px-3 py-1 text-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="create-subject"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Subject
                  </label>

                  <select
                    id="create-subject"
                    value={subjectId}
                    onChange={(event) => {
                      setSubjectId(event.target.value);
                      setTopicId("");
                    }}
                    disabled={isSubmitting}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                  >
                    <option value="">Select Subject</option>

                    {subjects.map((subject) => (
                      <option
                        key={subject.id}
                        value={subject.id}
                      >
                        {subject.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="create-topic"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Topic
                  </label>

                  <select
                    id="create-topic"
                    value={topicId}
                    onChange={(event) =>
                      setTopicId(event.target.value)
                    }
                    disabled={
                      isSubmitting ||
                      !subjectId ||
                      filteredTopics.length === 0
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                  >
                    <option value="">
                      {subjectId
                        ? filteredTopics.length > 0
                          ? "Select Topic"
                          : "No topics available"
                        : "Select a subject first"}
                    </option>

                    {filteredTopics.map((topic) => (
                      <option
                        key={topic.id}
                        value={topic.id}
                      >
                        {topic.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="create-question"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Question
                </label>

                <textarea
                  id="create-question"
                  value={questionText}
                  onChange={(event) =>
                    setQuestionText(event.target.value)
                  }
                  rows={4}
                  maxLength={5000}
                  placeholder="Enter the question..."
                  disabled={isSubmitting}
                  className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="option-a"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Option A
                  </label>

                  <input
                    id="option-a"
                    type="text"
                    value={optionA}
                    onChange={(event) =>
                      setOptionA(event.target.value)
                    }
                    maxLength={2000}
                    disabled={isSubmitting}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="option-b"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Option B
                  </label>

                  <input
                    id="option-b"
                    type="text"
                    value={optionB}
                    onChange={(event) =>
                      setOptionB(event.target.value)
                    }
                    maxLength={2000}
                    disabled={isSubmitting}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="option-c"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Option C
                  </label>

                  <input
                    id="option-c"
                    type="text"
                    value={optionC}
                    onChange={(event) =>
                      setOptionC(event.target.value)
                    }
                    maxLength={2000}
                    disabled={isSubmitting}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="option-d"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Option D
                  </label>

                  <input
                    id="option-d"
                    type="text"
                    value={optionD}
                    onChange={(event) =>
                      setOptionD(event.target.value)
                    }
                    maxLength={2000}
                    disabled={isSubmitting}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label
                    htmlFor="correct-answer"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Correct Answer
                  </label>

                  <select
                    id="correct-answer"
                    value={correctAnswer}
                    onChange={(event) =>
                      setCorrectAnswer(event.target.value)
                    }
                    disabled={isSubmitting}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                  >
                    <option value="A">Option A</option>
                    <option value="B">Option B</option>
                    <option value="C">Option C</option>
                    <option value="D">Option D</option>
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
                    value={difficulty}
                    onChange={(event) =>
                      setDifficulty(event.target.value)
                    }
                    disabled={isSubmitting}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                  >
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="marks"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Marks
                  </label>

                  <input
                    id="marks"
                    type="number"
                    min="1"
                    max="100"
                    step="1"
                    value={marks}
                    onChange={(event) =>
                      setMarks(event.target.value)
                    }
                    disabled={isSubmitting}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                  />
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
                    value={status}
                    onChange={(event) =>
                      setStatus(event.target.value)
                    }
                    disabled={isSubmitting}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="PUBLISHED">Published</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="explanation"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Explanation
                </label>

                <textarea
                  id="explanation"
                  value={explanation}
                  onChange={(event) =>
                    setExplanation(event.target.value)
                  }
                  rows={4}
                  maxLength={5000}
                  placeholder="Optional explanation shown during review..."
                  disabled={isSubmitting}
                  className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                />
              </div>

              {message && (
                <p className="text-sm font-medium text-green-600">
                  {message}
                </p>
              )}

              {error && (
                <p className="text-sm font-medium text-red-600">
                  {error}
                </p>
              )}

              <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={isSubmitting}
                  className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                >
                  {isSubmitting
                    ? "Creating..."
                    : "Create Question"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}