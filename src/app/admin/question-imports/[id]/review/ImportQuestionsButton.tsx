"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ImportQuestionsButtonProps {
  importId: string;
  totalItems: number;
}

export default function ImportQuestionsButton({
  importId,
  totalItems,
}: ImportQuestionsButtonProps) {
  const router = useRouter();

  const [isImporting, setIsImporting] =
    useState(false);

  const [error, setError] = useState("");

  async function handleImport() {
    const confirmed = window.confirm(
      `You are about to import ${totalItems.toLocaleString()} questions into the Question Bank as Draft questions.\n\nDo you want to continue?`
    );

    if (!confirmed) {
      return;
    }

    setIsImporting(true);
    setError("");

    try {
      const response = await fetch(
        `/api/admin/question-imports/${importId}/import`,
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message ||
            "Failed to import questions."
        );
        return;
      }

      window.alert(
        `${Number(
          data.importedCount ?? totalItems
        ).toLocaleString()} questions imported successfully as Draft.`
      );

      router.push("/admin/questions");
      router.refresh();
    } catch (error) {
      console.error(
        "Import questions error:",
        error
      );

      setError(
        "An unexpected error occurred while importing the questions."
      );
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleImport}
        disabled={
          isImporting || totalItems === 0
        }
        className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isImporting
          ? "Importing Questions..."
          : `Import ${totalItems.toLocaleString()} Questions`}
      </button>

      {error && (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}
    </div>
  );
}