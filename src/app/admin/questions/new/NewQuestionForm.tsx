"use client";

import { FormEvent, useState } from "react";
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

interface NewQuestionFormProps {
  subjects: Subject[];
}

const classOptions = [
  { value: "PRIMARY_1", label: "Primary 1" },
  { value: "PRIMARY_2", label: "Primary 2" },
  { value: "PRIMARY_3", label: "Primary 3" },
  { value: "PRIMARY_4", label: "Primary 4" },
  { value: "PRIMARY_5", label: "Primary 5" },
  { value: "PRIMARY_6", label: "Primary 6" },
  { value: "JHS_1", label: "JHS 1" },
  { value: "JHS_2", label: "JHS 2" },
  { value: "JHS_3", label: "JHS 3" },
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

export default function NewQuestionForm({
  subjects,
}: NewQuestionFormProps) {
  const router = useRouter();

  const [subjectId, setSubjectId] = useState("");
  const [topicId, setTopicId] = useState("");
  const [classLevel, setClassLevel] = useState("");
  const [examType, setExamType] = useState("");
  const [beceYear, setBeceYear] = useState("");

  const [questionText, setQuestionText] = useState("");
  const [optionA, setOptionA] = useState("");
  const [optionB, setOptionB] = useState("");
  const [optionC, setOptionC] = useState("");
  const [optionD, setOptionD] = useState("");
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [explanation, setExplanation] = useState("");
  const [difficulty, setDifficulty] = useState("MEDIUM");
  const [marks, setMarks] = useState("1");
  const [status, setStatus] = useState("DRAFT");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedSubject = subjects.find(
    (subject) => subject.id === subjectId
  );

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    if (!classLevel) {
      setError("Please select a class.");
      return;
    }

    if (!examType) {
      setError("Please select an exam type.");
      return;
    }

    if (examType === "BECE" && !beceYear) {
      setError("Please select a BECE year.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "/api/admin/questions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            subjectId,
            topicId: topicId || null,
            classLevel,
            examType,
            beceYear:
              examType === "BECE"
                ? Number(beceYear)
                : null,
            questionText,
            optionA,
            optionB,
            optionC,
            optionD,
            correctAnswer,
            explanation: explanation || null,
            difficulty,
            marks: Number(marks),
            status,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(
          data.message || "Unable to create question."
        );
        return;
      }

      router.push("/admin/questions");
      router.refresh();
    } catch {
      setError(
        "Unable to create question. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-4xl space-y-8"
    >
      {/* Question Details */}
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h2 className="text-lg font-bold text-slate-900">
          Question Details
        </h2>

        <div className="mt-6 space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Subject
              </label>

              <select
                value={subjectId}
                onChange={(event) => {
                  setSubjectId(event.target.value);
                  setTopicId("");
                }}
                required
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">
                  Select subject
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
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Class
              </label>

              <select
                value={classLevel}
                onChange={(event) =>
                  setClassLevel(event.target.value)
                }
                required
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">
                  Select class
                </option>

                {classOptions.map((classOption) => (
                  <option
                    key={classOption.value}
                    value={classOption.value}
                  >
                    {classOption.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Topic
              </label>

              <select
                value={topicId}
                onChange={(event) =>
                  setTopicId(event.target.value)
                }
                disabled={!selectedSubject}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none disabled:bg-slate-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">
                  No topic
                </option>

                {selectedSubject?.topics.map(
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
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Exam Type
              </label>

              <select
                value={examType}
                onChange={(event) => {
                  const value = event.target.value;

                  setExamType(value);

                  if (value !== "BECE") {
                    setBeceYear("");
                  }
                }}
                required
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">
                  Select exam type
                </option>

                {examTypeOptions.map((examOption) => (
                  <option
                    key={examOption.value}
                    value={examOption.value}
                  >
                    {examOption.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {examType === "BECE" && (
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                BECE Year
              </label>

              <input
                type="number"
                min="2000"
                max={new Date().getFullYear()}
                value={beceYear}
                onChange={(event) =>
                  setBeceYear(event.target.value)
                }
                required
                placeholder="Example: 2024"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

              <p className="mt-2 text-xs text-slate-500">
                Select the year of the BECE examination
                question.
              </p>
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Question
            </label>

            <textarea
              value={questionText}
              onChange={(event) =>
                setQuestionText(event.target.value)
              }
              required
              rows={5}
              placeholder="Enter the question..."
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>
      </section>

      {/* Options */}
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h2 className="text-lg font-bold text-slate-900">
          Answer Options
        </h2>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Option A
            </label>

            <input
              value={optionA}
              onChange={(event) =>
                setOptionA(event.target.value)
              }
              required
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Option B
            </label>

            <input
              value={optionB}
              onChange={(event) =>
                setOptionB(event.target.value)
              }
              required
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Option C
            </label>

            <input
              value={optionC}
              onChange={(event) =>
                setOptionC(event.target.value)
              }
              required
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Option D
            </label>

            <input
              value={optionD}
              onChange={(event) =>
                setOptionD(event.target.value)
              }
              required
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        <div className="mt-6">
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Correct Answer
          </label>

          <select
            value={correctAnswer}
            onChange={(event) =>
              setCorrectAnswer(event.target.value)
            }
            required
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="">
              Select correct answer
            </option>

            <option value="A">
              A
            </option>

            <option value="B">
              B
            </option>

            <option value="C">
              C
            </option>

            <option value="D">
              D
            </option>
          </select>
        </div>
      </section>

      {/* Settings */}
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h2 className="text-lg font-bold text-slate-900">
          Question Settings
        </h2>

        <div className="mt-6 grid gap-5 sm:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Difficulty
            </label>

            <select
              value={difficulty}
              onChange={(event) =>
                setDifficulty(event.target.value)
              }
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="EASY">
                Easy
              </option>

              <option value="MEDIUM">
                Medium
              </option>

              <option value="HARD">
                Hard
              </option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Marks
            </label>

            <input
              type="number"
              min="1"
              value={marks}
              onChange={(event) =>
                setMarks(event.target.value)
              }
              required
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Status
            </label>

            <select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value)
              }
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="DRAFT">
                Draft
              </option>

              <option value="PUBLISHED">
                Published
              </option>
            </select>
          </div>
        </div>

        <div className="mt-6">
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Explanation
          </label>

          <textarea
            value={explanation}
            onChange={(event) =>
              setExplanation(event.target.value)
            }
            rows={4}
            placeholder="Optional explanation shown after the student submits the test..."
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </section>

      {error && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 ring-1 ring-red-200">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={() =>
            router.push("/admin/questions")
          }
          className="rounded-xl border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading
            ? "Saving..."
            : "Create Question"}
        </button>
      </div>
    </form>
  );
}