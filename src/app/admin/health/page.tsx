import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export default async function AdminHealthPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const [
    totalUsers,
    activeStudents,
    inactiveStudents,
    totalSubjects,
    activeSubjects,
    totalQuestions,
    publishedQuestions,
    draftQuestions,
    archivedQuestions,
    totalExams,
    completedExams,
    activeExams,
    totalResults,
    successfulPayments,
    failedPayments,
    activeSubscriptions,
  ] = await Promise.all([
    prisma.user.count(),

    prisma.user.count({
      where: {
        role: "STUDENT",
        isActive: true,
      },
    }),

    prisma.user.count({
      where: {
        role: "STUDENT",
        isActive: false,
      },
    }),

    prisma.subject.count(),

    prisma.subject.count({
      where: {
        isActive: true,
      },
    }),

    prisma.question.count(),

    prisma.question.count({
      where: {
        status: "PUBLISHED",
      },
    }),

    prisma.question.count({
      where: {
        status: "DRAFT",
      },
    }),

    prisma.question.count({
      where: {
        status: "ARCHIVED",
      },
    }),

    prisma.exam.count(),

    prisma.exam.count({
      where: {
        status: {
          in: ["SUBMITTED", "AUTO_SUBMITTED", "MARKED"],
        },
      },
    }),

    prisma.exam.count({
      where: {
        status: "IN_PROGRESS",
      },
    }),

    prisma.result.count(),

    prisma.payment.count({
      where: {
        status: "SUCCESS",
      },
    }),

    prisma.payment.count({
      where: {
        status: "FAILED",
      },
    }),

    prisma.subscription.count({
      where: {
        status: "ACTIVE",
      },
    }),
  ]);

  const statGroups = [
    {
      title: "Users",
      description: "Student account and access information.",
      stats: [
        {
          label: "Total Users",
          value: totalUsers,
          className: "text-slate-900",
        },
        {
          label: "Active Students",
          value: activeStudents,
          className: "text-green-600",
        },
        {
          label: "Inactive Students",
          value: inactiveStudents,
          className: "text-red-600",
        },
      ],
    },
    {
      title: "Subjects",
      description: "Current subject availability.",
      stats: [
        {
          label: "Total Subjects",
          value: totalSubjects,
          className: "text-slate-900",
        },
        {
          label: "Active Subjects",
          value: activeSubjects,
          className: "text-green-600",
        },
      ],
    },
    {
      title: "Question Bank",
      description: "Question publication status.",
      stats: [
        {
          label: "Total Questions",
          value: totalQuestions,
          className: "text-slate-900",
        },
        {
          label: "Published",
          value: publishedQuestions,
          className: "text-green-600",
        },
        {
          label: "Draft",
          value: draftQuestions,
          className: "text-amber-600",
        },
        {
          label: "Archived",
          value: archivedQuestions,
          className: "text-slate-500",
        },
      ],
    },
    {
      title: "Exams",
      description: "Exam activity across the platform.",
      stats: [
        {
          label: "Total Exams",
          value: totalExams,
          className: "text-slate-900",
        },
        {
          label: "Completed",
          value: completedExams,
          className: "text-green-600",
        },
        {
          label: "In Progress",
          value: activeExams,
          className: "text-blue-600",
        },
      ],
    },
    {
      title: "Results",
      description: "Student examination results.",
      stats: [
        {
          label: "Total Results",
          value: totalResults,
          className: "text-slate-900",
        },
      ],
    },
    {
      title: "Payments",
      description: "Payment transaction status.",
      stats: [
        {
          label: "Successful",
          value: successfulPayments,
          className: "text-green-600",
        },
        {
          label: "Failed",
          value: failedPayments,
          className: "text-red-600",
        },
      ],
    },
    {
      title: "Subscriptions",
      description: "Currently active subscriptions.",
      stats: [
        {
          label: "Active",
          value: activeSubscriptions,
          className: "text-green-600",
        },
      ],
    },
  ];

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
          <div>
            <Link
              href="/admin"
              className="text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              ← Back to Admin Dashboard
            </Link>

            <h1 className="mt-3 text-2xl font-bold text-slate-900">
              Platform Health
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Read-only overview of the current platform state.
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {statGroups.map((group) => (
            <section
              key={group.title}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <h2 className="text-lg font-bold text-slate-900">
                {group.title}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {group.description}
              </p>

              <div className="mt-5 space-y-3">
                {group.stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3"
                  >
                    <span className="text-sm font-medium text-slate-600">
                      {stat.label}
                    </span>

                    <span
                      className={`text-xl font-bold ${stat.className}`}
                    >
                      {stat.value}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        <section className="mt-8 rounded-2xl border border-blue-200 bg-blue-50 p-6">
          <h2 className="text-lg font-bold text-blue-900">
            System Status
          </h2>

          <p className="mt-2 text-sm leading-6 text-blue-800">
            The platform health page is currently read-only. The statistics
            above are retrieved directly from the database and are intended
            to help administrators monitor the current state of the platform.
          </p>
        </section>
      </div>
    </main>
  );
}