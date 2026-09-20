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

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Subjects
            </h1>

            <p className="mt-2 text-slate-600">
              Manage examination subjects and view their content.
            </p>
          </div>

          <Link
            href="/admin"
            className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            ← Admin Dashboard
          </Link>
        </div>

        <CreateSubjectForm />

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {subjects.map((subject) => (
            <div
              key={subject.id}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">
                    {subject.name}
                  </h2>

                  <p className="mt-2 text-sm text-slate-600">
                    {subject.description ||
                      "No description available."}
                  </p>
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    subject.isActive
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {subject.isActive ? "Active" : "Inactive"}
                </span>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-slate-50 p-3 text-center">
                  <div className="text-xl font-bold text-slate-900">
                    {subject._count.questions}
                  </div>

                  <div className="mt-1 text-xs text-slate-500">
                    Questions
                  </div>
                </div>

                <div className="rounded-xl bg-slate-50 p-3 text-center">
                  <div className="text-xl font-bold text-slate-900">
                    {subject._count.topics}
                  </div>

                  <div className="mt-1 text-xs text-slate-500">
                    Topics
                  </div>
                </div>

                <div className="rounded-xl bg-slate-50 p-3 text-center">
                  <div className="text-xl font-bold text-slate-900">
                    {subject._count.exams}
                  </div>

                  <div className="mt-1 text-xs text-slate-500">
                    Exams
                  </div>
                </div>
              </div>

              <EditSubjectForm
                id={subject.id}
                initialName={subject.name}
                initialDescription={subject.description || ""}
                initialIsActive={subject.isActive}
              />
            </div>
          ))}

          {subjects.length === 0 && (
            <div className="col-span-full rounded-2xl border border-slate-200 bg-white p-12 text-center">
              <p className="text-sm text-slate-500">
                No subjects have been created yet.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}