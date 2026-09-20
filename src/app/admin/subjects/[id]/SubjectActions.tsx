"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

interface SubjectActionsProps {
  subject: {
    id: string;
    name: string;
    description: string | null;
    isActive: boolean;
    topicCount: number;
    questionCount: number;
    examCount: number;
  };
}

export default function SubjectActions({
  subject,
}: SubjectActionsProps) {
  const router = useRouter();

  const [name, setName] = useState(subject.name);
  const [description, setDescription] = useState(
    subject.description || ""
  );

  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `/api/admin/subjects/${subject.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            description,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to update subject.");
        return;
      }

      setSuccess("Subject updated successfully.");

      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function toggleStatus() {
    const nextStatus = !subject.isActive;

    const action = nextStatus ? "activate" : "deactivate";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} "${subject.name}"?`
    );

    if (!confirmed) {
      return;
    }

    setActionLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `/api/admin/subjects/${subject.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            isActive: nextStatus,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message || "Failed to update subject status."
        );
        return;
      }

      setSuccess(data.message || "Subject status updated.");

      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setActionLoading(false);
    }
  }

  async function deleteSubject() {
    if (
      subject.topicCount > 0 ||
      subject.questionCount > 0 ||
      subject.examCount > 0
    ) {
      setError(
        "This subject cannot be deleted because it contains related topics, questions, or exam history. Deactivate it instead."
      );

      return;
    }

    const confirmed = window.confirm(
      `Permanently delete "${subject.name}"? This action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    setActionLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `/api/admin/subjects/${subject.id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to delete subject.");
        return;
      }

      router.push("/admin/subjects");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <h2 className="text-lg font-bold text-slate-900">
        Manage Subject
      </h2>

      <form onSubmit={handleUpdate} className="mt-5 space-y-5">
        <div>
          <label
            htmlFor="subject-name"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Subject Name
          </label>

          <input
            id="subject-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={100}
            required
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div>
          <label
            htmlFor="subject-description"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Description
          </label>

          <textarea
            id="subject-description"
            value={description}
            onChange={(event) =>
              setDescription(event.target.value)
            }
            rows={5}
            maxLength={500}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            {success}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </form>

      <div className="mt-6 border-t border-slate-200 pt-6">
        <h3 className="text-sm font-bold text-slate-900">
          Subject Status
        </h3>

        <p className="mt-1 text-xs leading-5 text-slate-500">
          Inactive subjects cannot be selected for new examinations.
        </p>

        <button
          type="button"
          onClick={toggleStatus}
          disabled={actionLoading}
          className={`mt-4 w-full rounded-xl px-5 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
            subject.isActive
              ? "border border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100"
              : "bg-emerald-600 text-white hover:bg-emerald-700"
          }`}
        >
          {actionLoading
            ? "Processing..."
            : subject.isActive
              ? "Deactivate Subject"
              : "Activate Subject"}
        </button>
      </div>

      <div className="mt-6 border-t border-red-100 pt-6">
        <h3 className="text-sm font-bold text-red-700">
          Danger Zone
        </h3>

        <p className="mt-1 text-xs leading-5 text-slate-500">
          A subject can only be permanently deleted when it has no
          topics, questions, or exam history.
        </p>

        <button
          type="button"
          onClick={deleteSubject}
          disabled={
            actionLoading ||
            subject.topicCount > 0 ||
            subject.questionCount > 0 ||
            subject.examCount > 0
          }
          className="mt-4 w-full rounded-xl border border-red-300 bg-white px-5 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Delete Subject
        </button>
      </div>
    </section>
  );
}