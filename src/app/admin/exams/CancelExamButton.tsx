"use client";

import { useState } from "react";

interface CancelExamButtonProps {
  id: string;
  status:
    | "NOT_STARTED"
    | "IN_PROGRESS"
    | "SUBMITTED"
    | "AUTO_SUBMITTED"
    | "MARKED";
}

export default function CancelExamButton({
  id,
  status,
}: CancelExamButtonProps) {
  const [isCancelling, setIsCancelling] = useState(false);

  if (
    status !== "NOT_STARTED" &&
    status !== "IN_PROGRESS"
  ) {
    return null;
  }

  async function handleCancel() {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this unfinished exam? This action cannot be undone."
    );

    if (!confirmed) {
      return;
    }

    setIsCancelling(true);

    try {
      const response = await fetch(
        `/api/admin/exams/${id}/cancel`,
        {
          method: "PATCH",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        window.alert(
          data.message || "Failed to cancel the exam."
        );
        return;
      }

      window.alert("Exam cancelled successfully.");
      window.location.reload();
    } catch (error) {
      console.error("Cancel exam error:", error);

      window.alert(
        "An unexpected error occurred while cancelling the exam."
      );
    } finally {
      setIsCancelling(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCancel}
      disabled={isCancelling}
      className="rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {isCancelling ? "Cancelling..." : "Cancel"}
    </button>
  );
}