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

  function openExaminationSettings() {
    if (loading) return;

    setLoading(true);

    router.push(`/exam/settings/${subjectId}`);
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

      <button
        type="button"
        onClick={openExaminationSettings}
        disabled={loading}
        aria-busy={loading}
        className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Loading..." : "Start Test"}
      </button>
    </div>
  );
}