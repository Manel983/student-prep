import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

interface StudentDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function StudentDetailPage({
  params,
}: StudentDetailPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Verify administrator access
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

  const { id } = await params;

  // Get the student
  const student = await prisma.user.findFirst({
    where: {
      id,
      role: "STUDENT",
    },
    include: {
      profile: true,

      subscriptions: {
        orderBy: {
          createdAt: "desc",
        },
        include: {
          plan: true,
        },
      },

      exams: {
        orderBy: {
          createdAt: "desc",
        },
        take: 10,
        include: {
          subject: true,
          result: true,
        },
      },

      results: {
        orderBy: {
          completedAt: "desc",
        },
        take: 10,
        include: {
          exam: {
            include: {
              subject: true,
            },
          },
        },
      },
    },
  });

  if (!student) {
    redirect("/admin/students");
  }

  const totalResults = student.results.length;

  const averageScore =
    totalResults > 0
      ? student.results.reduce(
          (total, result) =>
            total + Number(result.percentage),
          0
        ) / totalResults
      : 0;

  const latestSubscription =
    student.subscriptions[0];

  return (
    <main className="p-6 sm:p-8">
      {/* Back */}
      <div className="mb-6">
        <Link
          href="/admin/students"
          className="text-sm font-semibold text-blue-600 hover:text-blue-800"
        >
          ← Back to Students
        </Link>
      </div>

      {/* Header */}
      <div className="mb-8">
        <p className="text-sm font-medium text-blue-600">
          Student Management
        </p>

        <div className="mt-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {student.firstName} {student.lastName}
            </h1>

            <p className="mt-2 text-slate-600">
              {student.email}
            </p>
          </div>

          {student.isActive ? (
            <span className="inline-flex w-fit rounded-full bg-green-50 px-4 py-2 text-sm font-semibold text-green-700">
              Active Account
            </span>
          ) : (
            <span className="inline-flex w-fit rounded-full bg-red-50 px-4 py-2 text-sm font-semibold text-red-700">
              Inactive Account
            </span>
          )}
        </div>
      </div>

      {/* Student Information */}
      <section className="mb-8">
        <h2 className="mb-4 text-xl font-bold text-slate-900">
          Student Information
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">
              School
            </p>

            <p className="mt-2 font-semibold text-slate-900">
              {student.profile?.school || "Not provided"}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">
              Class
            </p>

            <p className="mt-2 font-semibold text-slate-900">
              {student.profile?.classLevel || "Not provided"}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">
              Phone
            </p>

            <p className="mt-2 font-semibold text-slate-900">
              {student.profile?.phone || "Not provided"}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">
              Registered
            </p>

            <p className="mt-2 font-semibold text-slate-900">
              {student.createdAt.toLocaleDateString()}
            </p>
          </div>
        </div>
      </section>

      {/* Performance */}
      <section className="mb-8">
        <h2 className="mb-4 text-xl font-bold text-slate-900">
          Performance Overview
        </h2>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">
              Total Tests
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {student.exams.length}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">
              Completed Tests
            </p>

            <p className="mt-2 text-3xl font-bold text-blue-600">
              {totalResults}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">
              Average Score
            </p>

            <p className="mt-2 text-3xl font-bold text-green-600">
              {averageScore.toFixed(1)}%
            </p>
          </div>
        </div>
      </section>

      {/* Subscription */}
      <section className="mb-8">
        <h2 className="mb-4 text-xl font-bold text-slate-900">
          Subscription
        </h2>

        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          {latestSubscription ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-sm text-slate-500">
                  Plan
                </p>

                <p className="mt-1 font-semibold text-slate-900">
                  {latestSubscription.plan.name}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500">
                  Status
                </p>

                <p className="mt-1 font-semibold text-slate-900">
                  {latestSubscription.status}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500">
                  Tests Used
                </p>

                <p className="mt-1 font-semibold text-slate-900">
                  {latestSubscription.testsUsed}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500">
                  Expires
                </p>

                <p className="mt-1 font-semibold text-slate-900">
                  {latestSubscription.expiresAt
                    ? latestSubscription.expiresAt.toLocaleDateString()
                    : "No expiration"}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-slate-500">
              No subscription found.
            </p>
          )}
        </div>
      </section>

      {/* Exam History */}
      <section>
        <div className="mb-4">
          <h2 className="text-xl font-bold text-slate-900">
            Recent Exam History
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            The student's latest test attempts and results.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          {student.exams.length === 0 ? (
            <div className="p-10 text-center">
              <p className="font-medium text-slate-700">
                No exams taken yet.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-left">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Exam
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Subject
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Status
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Score
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Date
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {student.exams.map((exam) => (
                    <tr
                      key={exam.id}
                      className="hover:bg-slate-50"
                    >
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-900">
                          {exam.title}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {exam.totalQuestions} questions
                        </p>
                      </td>

                      <td className="px-6 py-4 text-sm text-slate-700">
                        {exam.subject.name}
                      </td>

                      <td className="px-6 py-4">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                          {exam.status}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        {exam.result ? (
                          <div>
                            <p className="font-semibold text-slate-900">
                              {exam.result.score}/
                              {exam.result.totalMarks}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {Number(
                                exam.result.percentage
                              ).toFixed(1)}
                              %
                            </p>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400">
                            Not available
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-sm text-slate-700">
                        {exam.createdAt.toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}