"use client";

import { useState } from "react";

interface ArchiveQuestionButtonProps {
  id: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
}

export default function ArchiveQuestionButton({
  id,
  status,
}: ArchiveQuestionButtonProps) {
  const [isArchiving, setIsArchiving] = useState(false);

  if (status === "ARCHIVED") {
    return null;
  }

  async function handleArchive() {
    const confirmed = window.confirm(
      "Are you sure you want to archive this question? It will no longer be available for new exams."
    );

    if (!confirmed) {
      return;
    }

    setIsArchiving(true);

    try {
      const response = await fetch(
        `/api/admin/questions/${id}/archive`,
        {
          method: "PATCH",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        window.alert(data.message || "Failed to archive question.");
        return;
      }

      window.alert("Question archived successfully.");
      window.location.reload();
    } catch (error) {
      console.error("Archive question error:", error);
      window.alert("An unexpected error occurred.");
    } finally {
      setIsArchiving(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleArchive}
      disabled={isArchiving}
      className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {isArchiving ? "Archiving..." : "Archive"}
    </button>
  );
}