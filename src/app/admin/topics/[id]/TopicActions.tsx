"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Subject {
  id: string;
  name: string;
  isActive: boolean;
}

interface TopicActionsProps {
  topic: {
    id: string;
    name: string;
    description: string | null;
    subjectId: string;
    questionCount: number;
  };
  subjects: Subject[];
}

export default function TopicActions({
  topic,
  subjects,
}: TopicActionsProps) {
  const router = useRouter();

  const [name, setName] = useState(topic.name);
  const [description, setDescription] = useState(
    topic.description || ""
  );
  const [subjectId, setSubjectId] = useState(topic.subjectId);

  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleUpdate(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const trimmedName = name.trim();

    if (trimmedName.length < 2) {
      setError(
        "Topic name must be at least 2 characters long."
      );
      return;
    }

    if (trimmedName.length > 100) {
      setError(
        "Topic name cannot exceed 100 characters."
      );
      return;
    }

    if (!subjectId) {
      setError("Please select a subject.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `/api/admin/topics/${topic.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: trimmedName,
            description: description.trim(),
            subjectId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message || "Failed to update topic."
        );
        return;
      }

      setSuccess("Topic updated successfully.");

      router.refresh();
    } catch {
      setError(
        "Something went wrong while updating the topic."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (topic.questionCount > 0) {
      setError(
        "This topic cannot be deleted because it has associated questions."
      );
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete "${topic.name}"? This action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");
    setDeleting(true);

    try {
      const response = await fetch(
        `/api/admin/topics/${topic.id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message || "Failed to delete topic."
        );
        return;
      }

      router.push("/admin/topics");
      router.refresh();
    } catch {
      setError(
        "Something went wrong while deleting the topic."
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Edit form */}
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-900">
            Topic Details
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Update the information below.
          </p>
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            {success}
          </div>
        )}

        <form
          onSubmit={handleUpdate}
          className="space-y-5"
        >
          {/* Subject */}
          <div>
            <label
              htmlFor="subjectId"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Subject
            </label>

            <select
              id="subjectId"
              value={subjectId}
              onChange={(event) =>
                setSubjectId(event.target.value)
              }
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
                  {!subject.isActive ? " (Inactive)" : ""}
                </option>
              ))}
            </select>

            <p className="mt-2 text-xs text-slate-400">
              Topics can only be assigned to active
              subjects.
            </p>
          </div>

          {/* Topic name */}
          <div>
            <label
              htmlFor="name"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Topic Name
            </label>

            <input
              id="name"
              type="text"
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              maxLength={100}
              placeholder="e.g. Fractions"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

            <p className="mt-2 text-xs text-slate-400">
              {name.length}/100 characters
            </p>
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="description"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Description
            </label>

            <textarea
              id="description"
              value={description}
              onChange={(event) =>
                setDescription(event.target.value)
              }
              rows={5}
              placeholder="Describe what students will learn in this topic..."
              className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

            <p className="mt-2 text-xs text-slate-400">
              Optional.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() =>
                router.push("/admin/topics")
              }
              className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </section>

      {/* Delete section */}
      <section className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-red-700">
              Delete Topic
            </h2>

            {topic.questionCount > 0 ? (
              <p className="mt-1 max-w-2xl text-sm text-slate-500">
                This topic has{" "}
                <span className="font-semibold text-slate-700">
                  {topic.questionCount}
                </span>{" "}
                associated question
                {topic.questionCount === 1 ? "" : "s"}.
                It must remain in the system unless those
                questions are moved or removed first.
              </p>
            ) : (
              <p className="mt-1 max-w-2xl text-sm text-slate-500">
                This topic has no questions and can be
                permanently deleted.
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={handleDelete}
            disabled={
              deleting || topic.questionCount > 0
            }
            className="shrink-0 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {deleting ? "Deleting..." : "Delete Topic"}
          </button>
        </div>
      </section>
    </div>
  );
}