"use client";

import { useState } from "react";

const QUESTION_CHECKBOX_SELECTOR =
  'input[data-question-selection="true"]';

export default function BulkPublishQuestionsButton() {
  const [isPublishing, setIsPublishing] = useState(false);

  function getSelectedQuestionIds() {
    const checkboxes = Array.from(
      document.querySelectorAll<HTMLInputElement>(
        QUESTION_CHECKBOX_SELECTOR
      )
    );

    return checkboxes
      .filter((checkbox) => checkbox.checked)
      .map((checkbox) => checkbox.value)
      .filter(Boolean);
  }

  async function handleBulkPublish() {
    const questionIds = getSelectedQuestionIds();

    if (questionIds.length === 0) {
      window.alert(
        "Please select at least one question to publish."
      );
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to publish ${questionIds.length.toLocaleString()} selected question${
        questionIds.length === 1 ? "" : "s"
      }?`
    );

    if (!confirmed) {
      return;
    }

    setIsPublishing(true);

    try {
      const response = await fetch(
        "/api/admin/questions/bulk-publish",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            questionIds,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        window.alert(
          data.message ||
            "Failed to publish selected questions."
        );
        return;
      }

      window.alert(
        data.message ||
          "Selected questions published successfully."
      );

      window.location.reload();
    } catch (error) {
      console.error(
        "Bulk publish questions error:",
        error
      );

      window.alert(
        "An unexpected error occurred while publishing questions."
      );
    } finally {
      setIsPublishing(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleBulkPublish}
      disabled={isPublishing}
      className="rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {isPublishing
        ? "Publishing..."
        : "Publish Selected"}
    </button>
  );
}