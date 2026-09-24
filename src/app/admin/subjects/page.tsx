import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import CreateSubjectForm from "./CreateSubjectForm";
import EditSubjectForm from "./EditSubjectForm";

export default async function AdminSubjectsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const subjects = await prisma.subject.findMany({
    include: {
      _count: {
        select: {
          questions: true,
          topics: true,
          exams: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  const activeSubjects = subjects.filter(
    (subject) => subject.isActive
  ).length;

  const inactiveSubjects = subjects.length - activeSubjects;

  const totalQuestions = subjects.reduce(
    (total, subject) => total + subject._count.questions,
    0
  );

  const totalTopics = subjects.reduce(
    (total, subject) => total + subject._count.topics,
    0
  );

  const totalExams = subjects.reduce(
    (total, subject) => total + subject._count.exams,
    0
  );

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <img
                  src="/logo.jpg"
                  alt="Student Prep"
                  className="h-11 w-auto object-contain"
                />

                <div>
                  <p className="text-sm font-bold text-blue-600">
                    Student Prep Administration
                  </p>

                  <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                    Subjects
                  </h1>
                </div>
              </div>

              <p className="mt-3 text-sm text-slate-500">
                Manage examination subjects and view their content.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-2 text-xs font-semibold text-green-700">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                Admin access active
              </span>

              <Link
                href="/admin"
                className="inline-flex items-center rounded-lg border border-blue-200 bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
              >
                ← Admin Dashboard
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Overview */}
        <section className="mb-8">
          <div className="mb-5">
            <div className="flex items-center gap-3">
              <div className="h-8 w-1 rounded-full bg-blue-600" />

              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Subject Overview
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Summary of the subjects and their content across the
                  platform.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-2xl border border-blue-200 bg-white p-5 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-lg">
                📚
              </div>

              <p className="mt-4 text-sm font-medium text-slate-500">
                Total Subjects
              </p>

              <p className="mt-1 text-3xl font-bold text-slate-900">
                {subjects.length}
              </p>
            </div>

            <div className="rounded-2xl border border-green-200 bg-white p-5 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 text-lg">
                ✓
              </div>

              <p className="mt-4 text-sm font-medium text-slate-500">
                Active Subjects
              </p>

              <p className="mt-1 text-3xl font-bold text-green-700">
                {activeSubjects}
              </p>
            </div>

            <div className="rounded-2xl border border-red-200 bg-white p-5 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-lg">
                !
              </div>

              <p className="mt-4 text-sm font-medium text-slate-500">
                Inactive Subjects
              </p>

              <p className="mt-1 text-3xl font-bold text-red-600">
                {inactiveSubjects}
              </p>
            </div>

            <div className="rounded-2xl border border-blue-200 bg-white p-5 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-lg">
                ❓
              </div>

              <p className="mt-4 text-sm font-medium text-slate-500">
                Total Questions
              </p>

              <p className="mt-1 text-3xl font-bold text-slate-900">
                {totalQuestions.toLocaleString()}
              </p>
            </div>

            <div className="rounded-2xl border border-green-200 bg-white p-5 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 text-lg">
                📝
              </div>

              <p className="mt-4 text-sm font-medium text-slate-500">
                Total Exams
              </p>

              <p className="mt-1 text-3xl font-bold text-slate-900">
                {totalExams.toLocaleString()}
              </p>
            </div>
          </div>
        </section>

        {/* Create Subject */}
        <CreateSubjectForm />

        {/* Subjects */}
        <section>
          <div className="mb-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-1 rounded-full bg-green-600" />

                  <div>
                    <h2 className="text-xl font-bold text-slate-900">
                      All Subjects
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      View, edit, and manage examination subjects.
                    </p>
                  </div>
                </div>
              </div>

              <span className="inline-flex w-fit rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                {subjects.length}{" "}
                {subjects.length === 1 ? "subject" : "subjects"}
              </span>
            </div>
          </div>

          {subjects.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-2xl">
                📚
              </div>

              <h3 className="mt-4 text-lg font-bold text-slate-900">
                No subjects yet
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                Create your first examination subject using the form above.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {subjects.map((subject) => (
                <article
                  key={subject.id}
                  className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-xl">
                      📚
                    </div>

                    <span
                      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                        subject.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          subject.isActive
                            ? "bg-green-600"
                            : "bg-red-600"
                        }`}
                      />

                      {subject.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <h3 className="mt-5 text-xl font-bold text-slate-900">
                    {subject.name}
                  </h3>

                  <p className="mt-2 min-h-10 text-sm leading-6 text-slate-500">
                    {subject.description || "No description provided."}
                  </p>

                  <div className="mt-5 grid grid-cols-3 gap-2">
                    <div className="rounded-xl bg-blue-50 p-3 text-center">
                      <p className="text-lg font-bold text-blue-700">
                        {subject._count.questions}
                      </p>

                      <p className="mt-1 text-[11px] font-medium text-slate-500">
                        Questions
                      </p>
                    </div>

                    <div className="rounded-xl bg-green-50 p-3 text-center">
                      <p className="text-lg font-bold text-green-700">
                        {subject._count.topics}
                      </p>

                      <p className="mt-1 text-[11px] font-medium text-slate-500">
                        Topics
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-3 text-center">
                      <p className="text-lg font-bold text-slate-700">
                        {subject._count.exams}
                      </p>

                      <p className="mt-1 text-[11px] font-medium text-slate-500">
                        Exams
                      </p>
                    </div>
                  </div>

                  <EditSubjectForm
                    id={subject.id}
                    initialName={subject.name}
                    initialDescription={subject.description || ""}
                    initialIsActive={subject.isActive}
                  />
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Content Summary */}
        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Content Summary
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Total learning content currently connected to your subjects.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 text-sm">
              <span className="rounded-full bg-blue-50 px-3 py-1.5 font-semibold text-blue-700">
                {totalQuestions.toLocaleString()} questions
              </span>

              <span className="rounded-full bg-green-50 px-3 py-1.5 font-semibold text-green-700">
                {totalTopics.toLocaleString()} topics
              </span>

              <span className="rounded-full bg-slate-100 px-3 py-1.5 font-semibold text-slate-700">
                {totalExams.toLocaleString()} exams
              </span>
            </div>
          </div>
        </section>

        {/* Navigation */}
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/admin"
            className="inline-flex items-center rounded-lg border border-blue-200 bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
          >
            ← Back to Admin Dashboard
          </Link>

          <Link
            href="/admin/questions"
            className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Manage Questions →
          </Link>

          <Link
            href="/admin/topics"
            className="inline-flex items-center rounded-lg border border-green-200 bg-white px-4 py-2.5 text-sm font-semibold text-green-700 transition hover:bg-green-50"
          >
            Manage Topics →
          </Link>
        </div>
      </div>
    </main>
  );
}