"use client";

import { FormEvent, useState } from "react";

interface EditSubjectFormProps {
  id: string;
  initialName: string;
  initialDescription: string;
  initialIsActive: boolean;
}

export default function EditSubjectForm({
  id,
  initialName,
  initialDescription,
  initialIsActive,
}: EditSubjectFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(
    initialDescription
  );
  const [isActive, setIsActive] = useState(initialIsActive);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function openForm() {
    setName(initialName);
    setDescription(initialDescription);
    setIsActive(initialIsActive);
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setError("");

    if (!name.trim()) {
      setError("Subject name is required.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/admin/subjects/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          isActive,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to update subject.");
        return;
      }

      setMessage("Subject updated successfully.");

      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch {
      setError(
        "Unable to update the subject. Please try again."
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
        className="mt-5 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
      >
        Edit Subject
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  Edit Subject
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Update the subject information.
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

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor={`edit-name-${id}`}
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Subject Name
                </label>

                <input
                  id={`edit-name-${id}`}
                  type="text"
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  maxLength={100}
                  disabled={isSubmitting}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                />
              </div>

              <div>
                <label
                  htmlFor={`edit-description-${id}`}
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Description
                </label>

                <textarea
                  id={`edit-description-${id}`}
                  value={description}
                  onChange={(event) =>
                    setDescription(event.target.value)
                  }
                  maxLength={500}
                  rows={4}
                  disabled={isSubmitting}
                  className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                />
              </div>

              <label className="flex cursor-pointer items-center gap-3 rounded-xl bg-slate-50 p-4">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(event) =>
                    setIsActive(event.target.checked)
                  }
                  disabled={isSubmitting}
                  className="h-4 w-4 rounded border-slate-300"
                />

                <span>
                  <span className="block text-sm font-medium text-slate-800">
                    Active Subject
                  </span>

                  <span className="block text-xs text-slate-500">
                    Active subjects can be used for new exams.
                  </span>
                </span>
              </label>

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

              <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
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