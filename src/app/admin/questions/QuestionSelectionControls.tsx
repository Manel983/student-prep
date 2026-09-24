"use client";

import { useEffect, useState } from "react";

interface QuestionSelectionControlsProps {
  totalQuestions: number;
}

const QUESTION_CHECKBOX_SELECTOR =
  'input[data-question-selection="true"]';

export default function QuestionSelectionControls({
  totalQuestions,
}: QuestionSelectionControlsProps) {
  const [selectedCount, setSelectedCount] = useState(0);

  function getCheckboxes() {
    return Array.from(
      document.querySelectorAll<HTMLInputElement>(
        QUESTION_CHECKBOX_SELECTOR
      )
    );
  }

  function updateSelectedCount() {
    const checkboxes = getCheckboxes();

    setSelectedCount(
      checkboxes.filter((checkbox) => checkbox.checked).length
    );
  }

  function handleSelectAll() {
    const checkboxes = getCheckboxes();

    checkboxes.forEach((checkbox) => {
      checkbox.checked = true;
    });

    updateSelectedCount();
  }

  function handleClearSelection() {
    const checkboxes = getCheckboxes();

    checkboxes.forEach((checkbox) => {
      checkbox.checked = false;
    });

    updateSelectedCount();
  }

  useEffect(() => {
    const handleCheckboxChange = () => {
      updateSelectedCount();
    };

    document.addEventListener(
      "change",
      handleCheckboxChange
    );

    updateSelectedCount();

    return () => {
      document.removeEventListener(
        "change",
        handleCheckboxChange
      );
    };
  }, []);

  return (
    <div className="mb-4 rounded-2xl border border-blue-200 bg-blue-50 p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-bold text-slate-900">
            Question Selection
          </p>

          <p className="mt-1 text-sm text-slate-600">
            Select questions for future bulk actions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-white px-3 py-2 text-sm font-semibold text-blue-700">
            {selectedCount.toLocaleString()} selected
          </span>

          <span className="rounded-full bg-white px-3 py-2 text-sm font-medium text-slate-600">
            {totalQuestions.toLocaleString()} available
          </span>

          <button
            type="button"
            onClick={handleSelectAll}
            disabled={totalQuestions === 0}
            className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Select All Filtered
          </button>

          <button
            type="button"
            onClick={handleClearSelection}
            disabled={selectedCount === 0}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Clear Selection
          </button>
        </div>
      </div>
    </div>
  );
}