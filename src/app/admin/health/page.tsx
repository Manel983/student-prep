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
      accent: "blue",
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
      accent: "green",
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
      accent: "blue",
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
          className: "text-blue-600",
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
      accent: "blue",
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
      accent: "green",
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
      accent: "green",
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
      accent: "blue",
      stats: [
        {
          label: "Active",
          value: activeSubscriptions,
          className: "text-green-600",
        },
      ],
    },
  ];

  const totalTrackedItems =
    totalUsers +
    totalSubjects +
    totalQuestions +
    totalExams +
    totalResults;

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-4">
            <img
              src="/logo.jpg"
              alt="Student Prep"
              className="h-11 w-auto object-contain"
            />

            <div className="min-w-0">
              <Link
                href="/admin"
                className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 transition hover:text-blue-700"
              >
                ← Back to Admin Dashboard
              </Link>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-900">
                  Platform Health
                </h1>

                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                  Read Only
                </span>
              </div>

              <p className="mt-1 text-sm text-slate-500">
                Monitor the current state of users, content, exams, results,
                payments, and subscriptions.
              </p>
            </div>
          </div>

          <div className="hidden rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-right sm:block">
            <p className="text-xs font-semibold uppercase tracking-wide text-green-700">
              Platform Monitor
            </p>

            <p className="mt-1 text-sm font-bold text-green-800">
              Database Connected
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Health Summary */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
            <p className="text-sm font-semibold text-blue-700">
              Users
            </p>

            <p className="mt-2 text-3xl font-bold text-blue-900">
              {totalUsers}
            </p>

            <p className="mt-1 text-xs text-blue-700">
              Total registered accounts
            </p>
          </div>

          <div className="rounded-2xl border border-green-200 bg-green-50 p-5 shadow-sm">
            <p className="text-sm font-semibold text-green-700">
              Active Students
            </p>

            <p className="mt-2 text-3xl font-bold text-green-800">
              {activeStudents}
            </p>

            <p className="mt-1 text-xs text-green-700">
              Currently active student accounts
            </p>
          </div>

          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
            <p className="text-sm font-semibold text-blue-700">
              Total Exams
            </p>

            <p className="mt-2 text-3xl font-bold text-blue-900">
              {totalExams}
            </p>

            <p className="mt-1 text-xs text-blue-700">
              Exams created across the platform
            </p>
          </div>

          <div className="rounded-2xl border border-green-200 bg-green-50 p-5 shadow-sm">
            <p className="text-sm font-semibold text-green-700">
              Active Subscriptions
            </p>

            <p className="mt-2 text-3xl font-bold text-green-800">
              {activeSubscriptions}
            </p>

            <p className="mt-1 text-xs text-green-700">
              Currently active subscriptions
            </p>
          </div>
        </section>

        {/* Detailed Health Groups */}
        <section className="mt-8">
          <div className="mb-5">
            <h2 className="text-xl font-bold text-slate-900">
              Platform Statistics
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Live read-only statistics retrieved directly from the database.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {statGroups.map((group) => {
              const accentClasses =
                group.accent === "green"
                  ? {
                      border: "border-green-200",
                      icon: "bg-green-100 text-green-700",
                    }
                  : {
                      border: "border-blue-200",
                      icon: "bg-blue-100 text-blue-700",
                    };

              return (
                <section
                  key={group.title}
                  className={`rounded-2xl border bg-white p-6 shadow-sm ${accentClasses.border}`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${accentClasses.icon}`}
                    >
                      {group.title.charAt(0)}
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-slate-900">
                        {group.title}
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        {group.description}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 space-y-3">
                    {group.stats.map((stat) => (
                      <div
                        key={stat.label}
                        className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
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
              );
            })}
          </div>
        </section>

        {/* System Status */}
        <section className="mt-8 rounded-2xl border border-blue-200 bg-blue-50 p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-100 text-lg font-bold text-green-700">
              ✓
            </div>

            <div>
              <h2 className="text-lg font-bold text-blue-900">
                System Status
              </h2>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-blue-800">
                The platform health page is currently read-only. The
                statistics above are retrieved directly from the database and
                are intended to help administrators monitor the current state
                of the platform.
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700">
                  Database statistics available
                </span>

                <span className="rounded-full border border-blue-200 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700">
                  Read-only monitoring
                </span>

                <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600">
                  {totalTrackedItems} tracked records
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Navigation */}
        <section className="mt-8">
          <h2 className="text-lg font-bold text-slate-900">
            Health & Management
          </h2>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              href="/admin/payment-health"
              className="rounded-xl border border-green-200 bg-white p-4 transition hover:bg-green-50"
            >
              <p className="font-semibold text-green-700">
                Payment Health
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Review payment system health.
              </p>
            </Link>

            <Link
              href="/admin/subscription-health"
              className="rounded-xl border border-blue-200 bg-white p-4 transition hover:bg-blue-50"
            >
              <p className="font-semibold text-blue-700">
                Subscription Health
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Monitor subscription status.
              </p>
            </Link>

            <Link
              href="/admin/usage"
              className="rounded-xl border border-blue-200 bg-white p-4 transition hover:bg-blue-50"
            >
              <p className="font-semibold text-blue-700">
                Usage
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Review platform usage.
              </p>
            </Link>

            <Link
              href="/admin"
              className="rounded-xl border border-slate-200 bg-white p-4 transition hover:bg-slate-50"
            >
              <p className="font-semibold text-slate-700">
                Admin Dashboard
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Return to administration.
              </p>
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}