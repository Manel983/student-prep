"use client";

import { useState } from "react";

interface RestoreQuestionButtonProps {
  id: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
}

export default function RestoreQuestionButton({
  id,
  status,
}: RestoreQuestionButtonProps) {
  const [isRestoring, setIsRestoring] = useState(false);

  if (status !== "ARCHIVED") {
    return null;
  }

  async function handleRestore() {
    const confirmed = window.confirm(
      "Are you sure you want to restore this question? It will be moved to Draft for review."
    );

    if (!confirmed) {
      return;
    }

    setIsRestoring(true);

    try {
      const response = await fetch(
        `/api/admin/questions/${id}/restore`,
        {
          method: "PATCH",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        window.alert(
          data.message || "Failed to restore question."
        );
        return;
      }

      window.alert("Question restored successfully.");
      window.location.reload();
    } catch (error) {
      console.error("Restore question error:", error);

      window.alert(
        "An unexpected error occurred."
      );
    } finally {
      setIsRestoring(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleRestore}
      disabled={isRestoring}
      className="rounded-lg border border-blue-200 px-3 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {isRestoring ? "Restoring..." : "Restore"}
    </button>
  );
}
