"use client";

import { useState } from "react";

interface PublishQuestionButtonProps {
  id: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
}

export default function PublishQuestionButton({
  id,
  status,
}: PublishQuestionButtonProps) {
  const [isPublishing, setIsPublishing] = useState(false);

  if (status !== "DRAFT") {
    return null;
  }

  async function handlePublish() {
    const confirmed = window.confirm(
      "Are you sure you want to publish this question? It will become available for new exams."
    );

    if (!confirmed) {
      return;
    }

    setIsPublishing(true);

    try {
      const response = await fetch(
        `/api/admin/questions/${id}/publish`,
        {
          method: "PATCH",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        window.alert(
          data.message || "Failed to publish question."
        );
        return;
      }

      window.alert("Question published successfully.");
      window.location.reload();
    } catch (error) {
      console.error("Publish question error:", error);

      window.alert(
        "An unexpected error occurred."
      );
    } finally {
      setIsPublishing(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handlePublish}
      disabled={isPublishing}
      className="rounded-lg border border-green-200 px-3 py-2 text-sm font-medium text-green-700 transition hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {isPublishing ? "Publishing..." : "Publish"}
    </button>
  );
}