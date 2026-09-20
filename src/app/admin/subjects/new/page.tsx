import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import NewSubjectForm from "./NewSubjectForm";

export default async function NewSubjectPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6">
          <Link
            href="/admin/subjects"
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            ← Back to Subjects
          </Link>

          <h1 className="mt-3 text-3xl font-bold text-slate-900">
            Add Subject
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Create a new examination subject.
          </p>
        </div>

        <NewSubjectForm />
      </div>
    </main>
  );
}