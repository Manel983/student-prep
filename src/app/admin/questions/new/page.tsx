import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import NewQuestionForm from "./NewQuestionForm";

export default async function NewQuestionPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const admin = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      role: true,
    },
  });

  if (!admin || admin.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const subjects = await prisma.subject.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      name: "asc",
    },
    include: {
      topics: {
        orderBy: {
          name: "asc",
        },
      },
    },
  });

  return (
    <main className="p-6 sm:p-8">
      <div className="mb-6">
        <Link
          href="/admin/questions"
          className="text-sm font-semibold text-blue-600 hover:text-blue-800"
        >
          ← Back to Question Bank
        </Link>
      </div>

      <div className="mb-8">
        <p className="text-sm font-medium text-blue-600">
          Question Bank
        </p>

        <h1 className="mt-1 text-3xl font-bold text-slate-900">
          Add Question
        </h1>

        <p className="mt-2 text-slate-600">
          Create a new question for the Student Prep examination system.
        </p>
      </div>

      <NewQuestionForm subjects={subjects} />
    </main>
  );
}