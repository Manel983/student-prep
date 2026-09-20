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

interface EditQuestionFormProps {
  id: string;
  initialSubjectId: string;
  initialTopicId: string;
  initialQuestionText: string;
  initialOptionA: string;
  initialOptionB: string;
  initialOptionC: string;
  initialOptionD: string;
  initialCorrectAnswer: string;
  initialExplanation: string;
  initialDifficulty: string;
  initialMarks: number;
  initialStatus: string;
  subjects: SubjectOption[];
  topics: TopicOption[];
}

export default function EditQuestionForm({
  id,
  initialSubjectId,
  initialTopicId,
  initialQuestionText,
  initialOptionA,
  initialOptionB,
  initialOptionC,
  initialOptionD,
  initialCorrectAnswer,
  initialExplanation,
  initialDifficulty,
  initialMarks,
  initialStatus,
  subjects,
  topics,
}: EditQuestionFormProps) {
  const [isOpen, setIsOpen] = useState(false);

  const [subjectId, setSubjectId] = useState(
    initialSubjectId
  );
  const [topicId, setTopicId] = useState(initialTopicId);

  const [questionText, setQuestionText] = useState(
    initialQuestionText
  );
  const [optionA, setOptionA] = useState(initialOptionA);
  const [optionB, setOptionB] = useState(initialOptionB);
  const [optionC, setOptionC] = useState(initialOptionC);
  const [optionD, setOptionD] = useState(initialOptionD);

  const [correctAnswer, setCorrectAnswer] = useState(
    initialCorrectAnswer
  );
  const [explanation, setExplanation] = useState(
    initialExplanation
  );
  const [difficulty, setDifficulty] = useState(
    initialDifficulty
  );
  const [marks, setMarks] = useState(
    String(initialMarks)
  );
  const [status, setStatus] = useState(initialStatus);

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

  function openForm() {
    setSubjectId(initialSubjectId);
    setTopicId(initialTopicId);
    setQuestionText(initialQuestionText);
    setOptionA(initialOptionA);
    setOptionB(initialOptionB);
    setOptionC(initialOptionC);
    setOptionD(initialOptionD);
    setCorrectAnswer(initialCorrectAnswer);
    setExplanation(initialExplanation);
    setDifficulty(initialDifficulty);
    setMarks(String(initialMarks));
    setStatus(initialStatus);

    setMessage("");
    setError("");
    setIsOpen(true);
  }

  function closeForm() {
    if (!isSubmitting) {
      setIsOpen(false);
      setMessage("");
      setError("");
    }
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
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
      setError(
        "Marks must be a whole number between 1 and 100."
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(
        `/api/admin/questions/${id}`,
        {
          method: "PATCH",
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
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message || "Failed to update question."
        );
        return;
      }

      setMessage("Question updated successfully.");

      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch {
      setError(
        "Unable to update the question. Please try again."
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
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
      >
        Edit
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 p-4">
          <div className="mx-auto my-8 w-full max-w-3xl rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">
                  Edit Question
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Update the examination question.
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

            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label
                    htmlFor={`edit-subject-${id}`}
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Subject
                  </label>

                  <select
                    id={`edit-subject-${id}`}
                    value={subjectId}
                    onChange={(event) => {
                      setSubjectId(event.target.value);
                      setTopicId("");
                    }}
                    disabled={isSubmitting}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                  >
                    <option value="">
                      Select Subject
                    </option>

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
                    htmlFor={`edit-topic-${id}`}
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Topic
                  </label>

                  <select
                    id={`edit-topic-${id}`}
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
                  htmlFor={`edit-question-${id}`}
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Question
                </label>

                <textarea
                  id={`edit-question-${id}`}
                  value={questionText}
                  onChange={(event) =>
                    setQuestionText(event.target.value)
                  }
                  rows={4}
                  maxLength={5000}
                  disabled={isSubmitting}
                  className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label
                    htmlFor={`edit-option-a-${id}`}
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Option A
                  </label>

                  <input
                    id={`edit-option-a-${id}`}
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
                    htmlFor={`edit-option-b-${id}`}
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Option B
                  </label>

                  <input
                    id={`edit-option-b-${id}`}
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
                    htmlFor={`edit-option-c-${id}`}
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Option C
                  </label>

                  <input
                    id={`edit-option-c-${id}`}
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
                    htmlFor={`edit-option-d-${id}`}
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Option D
                  </label>

                  <input
                    id={`edit-option-d-${id}`}
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
                    htmlFor={`edit-correct-answer-${id}`}
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Correct Answer
                  </label>

                  <select
                    id={`edit-correct-answer-${id}`}
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
                    htmlFor={`edit-difficulty-${id}`}
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Difficulty
                  </label>

                  <select
                    id={`edit-difficulty-${id}`}
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
                    htmlFor={`edit-marks-${id}`}
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Marks
                  </label>

                  <input
                    id={`edit-marks-${id}`}
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
                    htmlFor={`edit-status-${id}`}
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Status
                  </label>

                  <select
                    id={`edit-status-${id}`}
                    value={status}
                    onChange={(event) =>
                      setStatus(event.target.value)
                    }
                    disabled={isSubmitting}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="PUBLISHED">
                      Published
                    </option>
                    <option value="ARCHIVED">
                      Archived
                    </option>
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor={`edit-explanation-${id}`}
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Explanation
                </label>

                <textarea
                  id={`edit-explanation-${id}`}
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
                    ? "Saving..."
                    : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}