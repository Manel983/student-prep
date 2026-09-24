"use client";

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useState,
} from "react";

interface QuestionImport {
  id: string;
  fileName: string;
  fileType: string | null;
  fileSize: number | null;
  status: string;
  errorMessage: string | null;
  totalItems: number;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
}

interface ParseStatistics {
  totalRows: number;
  validRows: number;
  rejectedRows: number;
}

export default function QuestionImportsPage() {
  const [file, setFile] = useState<File | null>(null);

  const [imports, setImports] = useState<QuestionImport[]>(
    []
  );

  const [isLoadingImports, setIsLoadingImports] =
    useState(true);

  const [isUploading, setIsUploading] =
    useState(false);

  const [uploadMessage, setUploadMessage] =
    useState("");

  const [uploadError, setUploadError] =
    useState("");

  const [processingId, setProcessingId] =
    useState<string | null>(null);

  const [processMessage, setProcessMessage] =
    useState("");

  const [processError, setProcessError] =
    useState("");

  const [parseStatistics, setParseStatistics] =
    useState<ParseStatistics | null>(null);

  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  const [deleteMessage, setDeleteMessage] =
    useState("");

  const [deleteError, setDeleteError] =
    useState("");

  function formatFileSize(
    bytes: number | null
  ) {
    if (bytes === null) {
      return "Unknown";
    }

    if (bytes < 1024) {
      return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(
      bytes /
      (1024 * 1024)
    ).toFixed(2)} MB`;
  }

  function getFileExtension(
    fileName: string
  ) {
    const parts = fileName
      .toLowerCase()
      .split(".");

    return parts.length > 1
      ? parts.pop() || ""
      : "";
  }

  function getFileTypeLabel(
    fileName: string
  ) {
    const extension =
      getFileExtension(fileName);

    switch (extension) {
      case "xlsx":
        return "Excel";
      case "pdf":
        return "PDF";
      case "docx":
        return "DOCX";
      case "txt":
        return "TXT";
      default:
        return extension
          ? extension.toUpperCase()
          : "Unknown";
    }
  }

  function getStatusClasses(
    status: string
  ) {
    switch (status) {
      case "UPLOADED":
        return "bg-blue-100 text-blue-700";

      case "PROCESSING":
        return "bg-yellow-100 text-yellow-700";

      case "READY_FOR_REVIEW":
        return "bg-green-100 text-green-700";

      case "IMPORTED":
        return "bg-purple-100 text-purple-700";

      case "FAILED":
        return "bg-red-100 text-red-700";

      default:
        return "bg-slate-100 text-slate-700";
    }
  }

  async function loadImports() {
    setIsLoadingImports(true);

    try {
      const response =
        await fetch(
          "/api/admin/question-imports",
          {
            method: "GET",
            cache: "no-store",
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to load question imports."
        );
      }

      setImports(
        Array.isArray(data.imports)
          ? data.imports
          : []
      );
    } catch (error) {
      console.error(
        "Question imports loading error:",
        error
      );

      setProcessError(
        "Failed to load the imported question files."
      );
    } finally {
      setIsLoadingImports(false);
    }
  }

  useEffect(() => {
    loadImports();
  }, []);

  function handleFileChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const selectedFile =
      event.target.files?.[0] ?? null;

    setFile(selectedFile);
    setUploadMessage("");
    setUploadError("");
  }

  async function handleUpload(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setUploadMessage("");
    setUploadError("");

    if (!file) {
      setUploadError(
        "Please select a question document first."
      );
      return;
    }

    setIsUploading(true);

    try {
      const formData =
        new FormData();

      formData.append(
        "file",
        file
      );

      const response =
        await fetch(
          "/api/admin/question-imports/upload",
          {
            method: "POST",
            body: formData,
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        setUploadError(
          data.message ||
            "The question document could not be uploaded."
        );

        return;
      }

      setUploadMessage(
        data.message ||
          "Question document uploaded successfully."
      );

      setFile(null);

      const input =
        document.getElementById(
          "question-document"
        ) as HTMLInputElement | null;

      if (input) {
        input.value = "";
      }

      await loadImports();
    } catch (error) {
      console.error(
        "Question document upload error:",
        error
      );

      setUploadError(
        "An unexpected error occurred while uploading the document."
      );
    } finally {
      setIsUploading(false);
    }
  }

  async function handleProcess(
    questionImport: QuestionImport
  ) {
    setProcessMessage("");
    setProcessError("");
    setParseStatistics(null);

    setProcessingId(
      questionImport.id
    );

    const extension =
      getFileExtension(
        questionImport.fileName
      );

    try {
      const endpoint =
        extension === "xlsx"
          ? `/api/admin/question-imports/${encodeURIComponent(
              questionImport.id
            )}/parse-excel`
          : `/api/admin/question-imports/${encodeURIComponent(
              questionImport.id
            )}/extract`;

      const response =
        await fetch(
          endpoint,
          {
            method: "POST",
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        setProcessError(
          data.message ||
            `Failed to process ${questionImport.fileName}.`
        );

        await loadImports();

        return;
      }

      if (
        extension === "xlsx" &&
        data.statistics
      ) {
        setParseStatistics(
          data.statistics
        );
      }

      setProcessMessage(
        data.message ||
          `${questionImport.fileName} processed successfully.`
      );

      await loadImports();
    } catch (error) {
      console.error(
        "Question import processing error:",
        error
      );

      setProcessError(
        `An unexpected error occurred while processing ${questionImport.fileName}.`
      );
    } finally {
      setProcessingId(null);
    }
  }

  async function handleDelete(
    questionImport: QuestionImport
  ) {
    const confirmed =
      window.confirm(
        `Are you sure you want to permanently delete "${questionImport.fileName}" and its import data? This cannot be undone.`
      );

    if (!confirmed) {
      return;
    }

    setDeleteMessage("");
    setDeleteError("");

    setDeletingId(
      questionImport.id
    );

    try {
      const response =
        await fetch(
          `/api/admin/question-imports/${encodeURIComponent(
            questionImport.id
          )}/delete`,
          {
            method: "DELETE",
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        setDeleteError(
          data.message ||
            "The question import could not be deleted."
        );

        return;
      }

      setDeleteMessage(
        data.message ||
          `${questionImport.fileName} was deleted successfully.`
      );

      await loadImports();
    } catch (error) {
      console.error(
        "Question import deletion error:",
        error
      );

      setDeleteError(
        "An unexpected error occurred while deleting the question import."
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-600">
                Student Prep Administration
              </p>

              <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
                Import Question Documents
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                Upload, process, review, and manage
                examination question files.
              </p>
            </div>

            <a
              href="/admin"
              className="inline-flex w-fit items-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              ← Admin Dashboard
            </a>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Upload */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-xl font-bold text-blue-700">
              ↑
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Upload Question Document
              </h2>

              <p className="mt-1 text-sm leading-6 text-slate-500">
                Upload a PDF, DOCX, XLSX, or TXT file.
                The file will appear in the Imported
                Files list below.
              </p>
            </div>
          </div>

          <form
            onSubmit={handleUpload}
            className="mt-8"
          >
            <label
              htmlFor="question-document"
              className="block text-sm font-semibold text-slate-700"
            >
              Question document
            </label>

            <div className="mt-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 transition hover:border-blue-300 hover:bg-blue-50/30">
              <input
                id="question-document"
                name="file"
                type="file"
                accept=".pdf,.docx,.xlsx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain"
                onChange={handleFileChange}
                disabled={isUploading}
                className="block w-full cursor-pointer text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-600 file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-white file:transition hover:file:bg-blue-700 disabled:cursor-not-allowed"
              />

              <p className="mt-3 text-xs text-slate-500">
                Supported formats: PDF, DOCX, XLSX,
                TXT · Maximum file size: 10 MB
              </p>
            </div>

            {file && (
              <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50 p-4">
                <p className="text-sm font-semibold text-blue-800">
                  Selected file
                </p>

                <div className="mt-2 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <p className="break-all text-sm font-medium text-slate-900">
                    {file.name}
                  </p>

                  <p className="text-xs text-slate-500">
                    {formatFileSize(file.size)}
                  </p>
                </div>
              </div>
            )}

            {uploadError && (
              <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4">
                <p className="text-sm font-semibold text-red-800">
                  Upload failed
                </p>

                <p className="mt-1 text-sm text-red-700">
                  {uploadError}
                </p>
              </div>
            )}

            {uploadMessage && (
              <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4">
                <p className="text-sm font-semibold text-green-800">
                  Upload successful
                </p>

                <p className="mt-1 text-sm text-green-700">
                  {uploadMessage}
                </p>
              </div>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={
                  !file ||
                  isUploading
                }
                className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isUploading
                  ? "Uploading..."
                  : "Upload Document"}
              </button>

              {file &&
                !isUploading && (
                  <button
                    type="button"
                    onClick={() => {
                      setFile(null);
                      setUploadMessage("");
                      setUploadError("");

                      const input =
                        document.getElementById(
                          "question-document"
                        ) as HTMLInputElement | null;

                      if (input) {
                        input.value = "";
                      }
                    }}
                    className="rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Clear
                  </button>
                )}
            </div>
          </form>
        </section>

        {/* Processing messages */}
        {(processMessage ||
          processError ||
          deleteMessage ||
          deleteError ||
          parseStatistics) && (
          <section className="mt-6">
            {processError && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                <p className="text-sm font-semibold text-red-800">
                  Processing failed
                </p>

                <p className="mt-1 text-sm leading-6 text-red-700">
                  {processError}
                </p>
              </div>
            )}

            {processMessage && (
              <div className="rounded-xl border border-green-200 bg-green-50 p-4">
                <p className="text-sm font-semibold text-green-800">
                  Processing complete
                </p>

                <p className="mt-1 text-sm leading-6 text-green-700">
                  {processMessage}
                </p>
              </div>
            )}

            {deleteError && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
                <p className="text-sm font-semibold text-red-800">
                  Delete failed
                </p>

                <p className="mt-1 text-sm text-red-700">
                  {deleteError}
                </p>
              </div>
            )}

            {deleteMessage && (
              <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-4">
                <p className="text-sm font-semibold text-green-800">
                  Import deleted
                </p>

                <p className="mt-1 text-sm text-green-700">
                  {deleteMessage}
                </p>
              </div>
            )}

            {parseStatistics && (
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Total rows
                  </p>

                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {parseStatistics.totalRows.toLocaleString()}
                  </p>
                </div>

                <div className="rounded-xl bg-green-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-green-700">
                    Valid rows
                  </p>

                  <p className="mt-2 text-2xl font-bold text-green-800">
                    {parseStatistics.validRows.toLocaleString()}
                  </p>
                </div>

                <div className="rounded-xl bg-red-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-red-700">
                    Rejected rows
                  </p>

                  <p className="mt-2 text-2xl font-bold text-red-800">
                    {parseStatistics.rejectedRows.toLocaleString()}
                  </p>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Imported Files */}
        <section className="mt-8 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5 sm:px-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Imported Files
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Manage every question document uploaded
                  to the platform.
                </p>
              </div>

              <button
                type="button"
                onClick={loadImports}
                disabled={isLoadingImports}
                className="inline-flex w-fit rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoadingImports
                  ? "Refreshing..."
                  : "Refresh List"}
              </button>
            </div>
          </div>

          {isLoadingImports ? (
            <div className="p-8 text-center">
              <p className="text-sm text-slate-500">
                Loading imported files...
              </p>
            </div>
          ) : imports.length === 0 ? (
            <div className="p-8 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-2xl">
                📄
              </div>

              <h3 className="mt-4 font-bold text-slate-900">
                No imported files
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Upload your first examination question
                document above.
              </p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full">
                  <thead className="border-b border-slate-200 bg-slate-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        File
                      </th>

                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Type
                      </th>

                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Status
                      </th>

                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Questions
                      </th>

                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Uploaded
                      </th>

                      <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {imports.map(
                      (questionImport) => {
                        const extension =
                          getFileExtension(
                            questionImport.fileName
                          );

                        const isProcessing =
                          processingId ===
                          questionImport.id;

                        const isDeleting =
                          deletingId ===
                          questionImport.id;

                        const canProcess =
                          questionImport.status ===
                            "UPLOADED" ||
                          questionImport.status ===
                            "FAILED";

                        return (
                          <tr
                            key={
                              questionImport.id
                            }
                            className="transition hover:bg-slate-50"
                          >
                            <td className="max-w-xs px-6 py-5">
                              <p className="break-all text-sm font-semibold text-slate-900">
                                {
                                  questionImport.fileName
                                }
                              </p>

                              <p className="mt-1 break-all font-mono text-[11px] text-slate-400">
                                {
                                  questionImport.id
                                }
                              </p>

                              <p className="mt-1 text-xs text-slate-400">
                                {
                                  formatFileSize(
                                    questionImport.fileSize
                                  )
                                }
                              </p>
                            </td>

                            <td className="px-6 py-5">
                              <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                                {
                                  getFileTypeLabel(
                                    questionImport.fileName
                                  )
                                }
                              </span>
                            </td>

                            <td className="px-6 py-5">
                              <span
                                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(
                                  questionImport.status
                                )}`}
                              >
                                {
                                  questionImport.status
                                }
                              </span>

                              {questionImport.errorMessage && (
                                <p className="mt-2 max-w-xs text-xs leading-5 text-red-600">
                                  {
                                    questionImport.errorMessage
                                  }
                                </p>
                              )}
                            </td>

                            <td className="px-6 py-5">
                              <p className="text-sm font-bold text-slate-900">
                                {questionImport.itemCount.toLocaleString()}
                              </p>

                              <p className="text-xs text-slate-400">
                                import items
                              </p>
                            </td>

                            <td className="whitespace-nowrap px-6 py-5">
                              <p className="text-sm text-slate-700">
                                {new Date(
                                  questionImport.createdAt
                                ).toLocaleDateString()}
                              </p>

                              <p className="mt-1 text-xs text-slate-400">
                                {new Date(
                                  questionImport.createdAt
                                ).toLocaleTimeString()}
                              </p>
                            </td>

                            <td className="px-6 py-5">
                              <div className="flex flex-wrap justify-end gap-2">
                                {canProcess && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleProcess(
                                        questionImport
                                      )
                                    }
                                    disabled={
                                      isProcessing ||
                                      isDeleting
                                    }
                                    className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    {isProcessing
                                      ? extension ===
                                        "xlsx"
                                        ? "Processing Excel..."
                                        : "Processing..."
                                      : extension ===
                                        "xlsx"
                                        ? "Process Excel"
                                        : `Process ${extension.toUpperCase()}`}
                                  </button>
                                )}

                                {questionImport.status ===
                                  "READY_FOR_REVIEW" && (
                                  <a
                                    href={`/admin/question-imports/${questionImport.id}/review`}
                                    className="rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-green-700"
                                  >
                                    Open Review
                                  </a>
                                )}

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDelete(
                                      questionImport
                                    )
                                  }
                                  disabled={
                                    isProcessing ||
                                    isDeleting
                                  }
                                  className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {isDeleting
                                    ? "Deleting..."
                                    : "Delete"}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="divide-y divide-slate-100 lg:hidden">
                {imports.map(
                  (questionImport) => {
                    const extension =
                      getFileExtension(
                        questionImport.fileName
                      );

                    const isProcessing =
                      processingId ===
                      questionImport.id;

                    const isDeleting =
                      deletingId ===
                      questionImport.id;

                    const canProcess =
                      questionImport.status ===
                        "UPLOADED" ||
                      questionImport.status ===
                        "FAILED";

                    return (
                      <div
                        key={
                          questionImport.id
                        }
                        className="p-5"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <p className="break-all font-semibold text-slate-900">
                              {
                                questionImport.fileName
                              }
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {
                                getFileTypeLabel(
                                  questionImport.fileName
                                )
                              }{" "}
                              ·{" "}
                              {
                                formatFileSize(
                                  questionImport.fileSize
                                )
                              }
                            </p>
                          </div>

                          <span
                            className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClasses(
                              questionImport.status
                            )}`}
                          >
                            {
                              questionImport.status
                            }
                          </span>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-3">
                          <div className="rounded-lg bg-slate-50 p-3">
                            <p className="text-xs text-slate-500">
                              Questions
                            </p>

                            <p className="mt-1 font-bold text-slate-900">
                              {questionImport.itemCount.toLocaleString()}
                            </p>
                          </div>

                          <div className="rounded-lg bg-slate-50 p-3">
                            <p className="text-xs text-slate-500">
                              Uploaded
                            </p>

                            <p className="mt-1 text-sm font-semibold text-slate-900">
                              {new Date(
                                questionImport.createdAt
                              ).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        {questionImport.errorMessage && (
                          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3">
                            <p className="text-xs leading-5 text-red-700">
                              {
                                questionImport.errorMessage
                              }
                            </p>
                          </div>
                        )}

                        <div className="mt-4 flex flex-wrap gap-2">
                          {canProcess && (
                            <button
                              type="button"
                              onClick={() =>
                                handleProcess(
                                  questionImport
                                )
                              }
                              disabled={
                                isProcessing ||
                                isDeleting
                              }
                              className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {isProcessing
                                ? extension ===
                                  "xlsx"
                                  ? "Processing Excel..."
                                  : "Processing..."
                                : extension ===
                                  "xlsx"
                                  ? "Process Excel"
                                  : `Process ${extension.toUpperCase()}`}
                            </button>
                          )}

                          {questionImport.status ===
                            "READY_FOR_REVIEW" && (
                            <a
                              href={`/admin/question-imports/${questionImport.id}/review`}
                              className="rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white"
                            >
                              Open Review
                            </a>
                          )}

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(
                                questionImport
                              )
                            }
                            disabled={
                              isProcessing ||
                              isDeleting
                            }
                            className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isDeleting
                              ? "Deleting..."
                              : "Delete"}
                          </button>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </>
          )}
        </section>

        {/* Import Workflow */}
        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-lg font-bold text-slate-900">
            Question Import Workflow
          </h2>

          <div className="mt-5 grid gap-4 md:grid-cols-4">
            <div className="rounded-xl border border-slate-200 p-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 font-bold text-blue-700">
                1
              </div>

              <h3 className="mt-3 font-semibold text-slate-900">
                Upload
              </h3>

              <p className="mt-1 text-sm leading-6 text-slate-500">
                Upload PDF, DOCX, XLSX, or TXT
                question files.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 p-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-yellow-100 font-bold text-yellow-700">
                2
              </div>

              <h3 className="mt-3 font-semibold text-slate-900">
                Process
              </h3>

              <p className="mt-1 text-sm leading-6 text-slate-500">
                Extract and validate the question
                content.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 p-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-100 font-bold text-green-700">
                3
              </div>

              <h3 className="mt-3 font-semibold text-slate-900">
                Review
              </h3>

              <p className="mt-1 text-sm leading-6 text-slate-500">
                Check classification before importing
                questions.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 p-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-100 font-bold text-purple-700">
                4
              </div>

              <h3 className="mt-3 font-semibold text-slate-900">
                Import & Publish
              </h3>

              <p className="mt-1 text-sm leading-6 text-slate-500">
                Move approved questions into the main
                question bank.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}