"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface SubjectCardProps {
  subjectId: string;
  name: string;
  icon: string;
  description: string;
}

export default function SubjectCard({
  subjectId,
  name,
  icon,
  description,
}: SubjectCardProps) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function startTest() {
    // Prevent duplicate clicks while a test is being created.
    if (loading) return;

    setLoading(true);
    setError("");

    // One unique key belongs to this particular Start Test action.
    // If the request is accidentally repeated with the same key,
    // the server will return the already-created exam instead
    // of creating another one.
    const creationKey = crypto.randomUUID();

    try {
      const response = await fetch("/api/exams/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subjectId,
          creationKey,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(
          data.message ||
            "Unable to start the test. Please try again."
        );
        return;
      }

      router.push(`/exam/${data.exam.id}`);
    } catch {
      setError(
        "Unable to start the test. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <div className="text-3xl">{icon}</div>

        <div>
          <h3 className="text-lg font-semibold">
            {name}
          </h3>

          <p className="text-sm text-gray-600">
            {description}
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={startTest}
        disabled={loading}
        aria-busy={loading}
        className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Starting..." : "Start Test"}
      </button>
    </div>
  );
}