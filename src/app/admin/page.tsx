import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import AdminAnalytics from "./AdminAnalytics";

export default async function AdminDashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const admin = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
    },
  });

  if (!admin || !admin.isActive || admin.role !== "ADMIN") {
    redirect("/dashboard");
  }

  // ---------------------------------------------------------
  // Analytics date range
  // ---------------------------------------------------------

  const sixMonthsAgo = new Date();

  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  // ---------------------------------------------------------
  // Dashboard statistics and recent activity
  // ---------------------------------------------------------

  const [
    totalStudents,
    totalSubjects,
    totalQuestions,
    totalExams,
    totalResults,
    successfulPayments,
    activeSubscriptions,
    pendingPayments,
    successfulPaymentRevenue,
    recentStudents,
    recentPayments,
    recentResults,
    recentSubscriptions,
    analyticsExams,
    analyticsPayments,
    analyticsResults,
  ] = await Promise.all([
    prisma.user.count({
      where: {
        role: "STUDENT",
      },
    }),

    prisma.subject.count(),

    prisma.question.count(),

    prisma.exam.count(),

    prisma.result.count(),

    prisma.payment.count({
      where: {
        status: "SUCCESS",
      },
    }),

    prisma.subscription.count({
      where: {
        status: "ACTIVE",
      },
    }),

    prisma.payment.count({
      where: {
        status: "PENDING",
      },
    }),

    prisma.payment.aggregate({
      where: {
        status: "SUCCESS",
      },
      _sum: {
        amount: true,
      },
    }),

    prisma.user.findMany({
      where: {
        role: "STUDENT",
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    }),

    prisma.payment.findMany({
      where: {
        status: "SUCCESS",
      },
      select: {
        id: true,
        reference: true,
        amount: true,
        currency: true,
        paidAt: true,
        createdAt: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    }),

    prisma.result.findMany({
      select: {
        id: true,
        score: true,
        totalMarks: true,
        percentage: true,
        completedAt: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        exam: {
          select: {
            title: true,
            subject: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        completedAt: "desc",
      },
      take: 5,
    }),

    prisma.subscription.findMany({
      select: {
        id: true,
        status: true,
        createdAt: true,
        startedAt: true,
        expiresAt: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        plan: {
          select: {
            name: true,
            type: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    }),

    // -------------------------------------------------------
    // Analytics: exams
    // -------------------------------------------------------

    prisma.exam.findMany({
      where: {
        createdAt: {
          gte: sixMonthsAgo,
        },
      },
      select: {
        createdAt: true,
      },
    }),

    // -------------------------------------------------------
    // Analytics: successful payments
    // -------------------------------------------------------

    prisma.payment.findMany({
      where: {
        status: "SUCCESS",
        createdAt: {
          gte: sixMonthsAgo,
        },
      },
      select: {
        amount: true,
        createdAt: true,
      },
    }),

    // -------------------------------------------------------
    // Analytics: results
    // -------------------------------------------------------

    prisma.result.findMany({
      where: {
        completedAt: {
          gte: sixMonthsAgo,
        },
      },
      select: {
        percentage: true,
        completedAt: true,
      },
    }),
  ]);

  // ---------------------------------------------------------
  // Revenue
  // ---------------------------------------------------------

  const revenue = Number(
    successfulPaymentRevenue._sum.amount ?? 0
  );

  // ---------------------------------------------------------
  // Build six-month analytics data
  // ---------------------------------------------------------

  const analyticsData = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(sixMonthsAgo);

    date.setMonth(sixMonthsAgo.getMonth() + index);

    const year = date.getFullYear();
    const month = date.getMonth();

    const monthLabel = date.toLocaleString("en-US", {
      month: "short",
    });

    const exams = analyticsExams.filter((exam) => {
      const examDate = exam.createdAt;

      return (
        examDate.getFullYear() === year &&
        examDate.getMonth() === month
      );
    }).length;

    const monthlyPayments = analyticsPayments.filter(
      (payment) => {
        const paymentDate = payment.createdAt;

        return (
          paymentDate.getFullYear() === year &&
          paymentDate.getMonth() === month
        );
      }
    );

    const monthlyRevenue = monthlyPayments.reduce(
      (total, payment) =>
        total + Number(payment.amount),
      0
    );

    const monthlyResults = analyticsResults.filter(
      (result) => {
        const resultDate = result.completedAt;

        return (
          resultDate.getFullYear() === year &&
          resultDate.getMonth() === month
        );
      }
    );

    const averagePercentage =
      monthlyResults.length > 0
        ? monthlyResults.reduce(
            (total, result) =>
              total + Number(result.percentage),
            0
          ) / monthlyResults.length
        : 0;

    return {
      month: monthLabel,
      exams,
      revenue: Number(monthlyRevenue.toFixed(2)),
      averagePercentage: Number(
        averagePercentage.toFixed(2)
      ),
    };
  });

  // ---------------------------------------------------------
  // Dashboard statistic cards
  // ---------------------------------------------------------

  const statistics = [
    {
      label: "Total Students",
      value: totalStudents,
      href: "/admin/students",
      description: "Registered student accounts",
    },
    {
      label: "Total Subjects",
      value: totalSubjects,
      href: "/admin/subjects",
      description: "Available subjects",
    },
    {
      label: "Total Questions",
      value: totalQuestions,
      href: "/admin/questions",
      description: "Questions in the system",
    },
    {
      label: "Total Exams",
      value: totalExams,
      href: "/admin/exams",
      description: "Student exams created",
    },
    {
      label: "Completed Results",
      value: totalResults,
      href: "/admin/results",
      description: "Marked examination results",
    },
    {
      label: "Active Subscriptions",
      value: activeSubscriptions,
      href: "/admin/subscriptions",
      description: "Currently active subscriptions",
    },
    {
      label: "Successful Payments",
      value: successfulPayments,
      href: "/admin/payments",
      description: "Successfully processed payments",
    },
    {
      label: "Pending Payments",
      value: pendingPayments,
      href: "/admin/payments",
      description: "Payments awaiting processing",
    },
  ];

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">
                Student Prep Administration
              </p>

              <h1 className="mt-1 text-3xl font-bold text-slate-900">
                Admin Dashboard
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Welcome back, {admin.firstName} {admin.lastName}.
              </p>
            </div>

            <Link
              href="/dashboard"
              className="inline-flex w-fit rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Student Dashboard
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* =================================================
            SYSTEM OVERVIEW
        ================================================= */}

        <section>
          <div className="mb-5">
            <h2 className="text-xl font-bold text-slate-900">
              System Overview
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Current statistics from the Student Prep platform.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {statistics.map((stat) => (
              <Link
                key={stat.label}
                href={stat.href}
                className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
              >
                <p className="text-sm font-medium text-slate-500">
                  {stat.label}
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {stat.value.toLocaleString()}
                </p>

                <p className="mt-2 text-xs text-slate-500">
                  {stat.description}
                </p>

                <p className="mt-4 text-sm font-semibold text-blue-600 group-hover:text-blue-700">
                  View details →
                </p>
              </Link>
            ))}
          </div>
        </section>

        {/* =================================================
            PAYMENT REVENUE
        ================================================= */}

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Payment Revenue
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Total value of successfully processed payments.
              </p>
            </div>

            <Link
              href="/admin/payments"
              className="text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              View Payments →
            </Link>
          </div>

          <div className="mt-6 rounded-xl bg-slate-50 p-6">
            <p className="text-sm font-medium text-slate-500">
              Successful Payment Revenue
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              GHS {revenue.toFixed(2)}
            </p>
          </div>
        </section>

        {/* =================================================
            RECENT ACTIVITY
        ================================================= */}

        <section className="mt-8">
          <div className="mb-5">
            <h2 className="text-xl font-bold text-slate-900">
              Recent Activity
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              The latest activity across the platform.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Recent Students */}

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-slate-900">
                    Recent Students
                  </h3>

                  <p className="mt-1 text-xs text-slate-500">
                    Latest registered student accounts.
                  </p>
                </div>

                <Link
                  href="/admin/students"
                  className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                >
                  View all
                </Link>
              </div>

              <div className="mt-5 divide-y divide-slate-100">
                {recentStudents.length === 0 ? (
                  <p className="py-5 text-sm text-slate-500">
                    No students registered yet.
                  </p>
                ) : (
                  recentStudents.map((student) => (
                    <div
                      key={student.id}
                      className="py-4 first:pt-0 last:pb-0"
                    >
                      <p className="font-semibold text-slate-900">
                        {student.firstName} {student.lastName}
                      </p>

                      <p className="mt-1 break-all text-sm text-slate-500">
                        {student.email}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        Registered{" "}
                        {student.createdAt.toLocaleString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recent Payments */}

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-slate-900">
                    Recent Successful Payments
                  </h3>

                  <p className="mt-1 text-xs text-slate-500">
                    Latest successfully processed payments.
                  </p>
                </div>

                <Link
                  href="/admin/payments"
                  className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                >
                  View all
                </Link>
              </div>

              <div className="mt-5 divide-y divide-slate-100">
                {recentPayments.length === 0 ? (
                  <p className="py-5 text-sm text-slate-500">
                    No successful payments yet.
                  </p>
                ) : (
                  recentPayments.map((payment) => (
                    <div
                      key={payment.id}
                      className="py-4 first:pt-0 last:pb-0"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900">
                            {payment.user.firstName}{" "}
                            {payment.user.lastName}
                          </p>

                          <p className="mt-1 break-all text-xs text-slate-500">
                            {payment.reference}
                          </p>
                        </div>

                        <p className="whitespace-nowrap font-bold text-green-600">
                          {payment.currency}{" "}
                          {Number(payment.amount).toFixed(2)}
                        </p>
                      </div>

                      <p className="mt-1 text-xs text-slate-400">
                        {payment.paidAt
                          ? payment.paidAt.toLocaleString()
                          : payment.createdAt.toLocaleString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recent Results */}

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-slate-900">
                    Recent Exam Results
                  </h3>

                  <p className="mt-1 text-xs text-slate-500">
                    Latest completed student examinations.
                  </p>
                </div>

                <Link
                  href="/admin/results"
                  className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                >
                  View all
                </Link>
              </div>

              <div className="mt-5 divide-y divide-slate-100">
                {recentResults.length === 0 ? (
                  <p className="py-5 text-sm text-slate-500">
                    No results available yet.
                  </p>
                ) : (
                  recentResults.map((result) => (
                    <div
                      key={result.id}
                      className="py-4 first:pt-0 last:pb-0"
                    >
                      <p className="font-semibold text-slate-900">
                        {result.user.firstName}{" "}
                        {result.user.lastName}
                      </p>

                      <p className="mt-1 text-sm text-slate-600">
                        {result.exam.subject.name} ·{" "}
                        {result.exam.title}
                      </p>

                      <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
                        <span>
                          Score:{" "}
                          <strong className="text-slate-900">
                            {result.score}/{result.totalMarks}
                          </strong>
                        </span>

                        <span>
                          Percentage:{" "}
                          <strong className="text-blue-600">
                            {Number(result.percentage).toFixed(2)}%
                          </strong>
                        </span>
                      </div>

                      <p className="mt-1 text-xs text-slate-400">
                        {result.completedAt.toLocaleString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recent Subscriptions */}

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-slate-900">
                    Recent Subscriptions
                  </h3>

                  <p className="mt-1 text-xs text-slate-500">
                    Latest subscription activity.
                  </p>
                </div>

                <Link
                  href="/admin/subscriptions"
                  className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                >
                  View all
                </Link>
              </div>

              <div className="mt-5 divide-y divide-slate-100">
                {recentSubscriptions.length === 0 ? (
                  <p className="py-5 text-sm text-slate-500">
                    No subscriptions available yet.
                  </p>
                ) : (
                  recentSubscriptions.map((subscription) => (
                    <div
                      key={subscription.id}
                      className="py-4 first:pt-0 last:pb-0"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-semibold text-slate-900">
                            {subscription.user.firstName}{" "}
                            {subscription.user.lastName}
                          </p>

                          <p className="mt-1 text-sm text-slate-600">
                            {subscription.plan.name}
                          </p>
                        </div>

                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            subscription.status === "ACTIVE"
                              ? "bg-green-100 text-green-700"
                              : subscription.status === "EXPIRED"
                                ? "bg-red-100 text-red-700"
                                : subscription.status === "CANCELLED"
                                  ? "bg-slate-100 text-slate-700"
                                  : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {subscription.status}
                        </span>
                      </div>

                      <p className="mt-1 text-xs text-slate-400">
                        Created{" "}
                        {subscription.createdAt.toLocaleString()}
                      </p>

                      {subscription.expiresAt && (
                        <p className="mt-1 text-xs text-slate-400">
                          Expires{" "}
                          {subscription.expiresAt.toLocaleString()}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>

        {/* =================================================
            ANALYTICS
        ================================================= */}

        <AdminAnalytics data={analyticsData} />

        {/* =================================================
            ADMINISTRATION
        ================================================= */}

        <section className="mt-8">
          <h2 className="text-xl font-bold text-slate-900">
            Administration
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Manage the main platform resources.
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              href="/admin/students"
              className="rounded-xl border border-slate-200 bg-white p-5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50"
            >
              Manage Students
            </Link>

            <Link
              href="/admin/subjects"
              className="rounded-xl border border-slate-200 bg-white p-5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50"
            >
              Manage Subjects
            </Link>

            <Link
              href="/admin/questions"
              className="rounded-xl border border-slate-200 bg-white p-5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50"
            >
              Manage Questions
            </Link>

            <Link
              href="/admin/exams"
              className="rounded-xl border border-slate-200 bg-white p-5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50"
            >
              Manage Exams
            </Link>

            <Link
              href="/admin/results"
              className="rounded-xl border border-slate-200 bg-white p-5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50"
            >
              Manage Results
            </Link>

            <Link
              href="/admin/subscriptions"
              className="rounded-xl border border-slate-200 bg-white p-5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50"
            >
              Manage Subscriptions
            </Link>

            <Link
              href="/admin/payments"
              className="rounded-xl border border-slate-200 bg-white p-5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50"
            >
              Manage Payments
            </Link>
          </div>
        </section>

        {/* =================================================
            PLATFORM HEALTH & REPORTS
        ================================================= */}

        <section className="mt-8">
          <h2 className="text-xl font-bold text-slate-900">
            Platform Health & Reports
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Monitor platform health, usage, content quality,
            subscriptions, and payments.
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              href="/admin/health"
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:bg-blue-50"
            >
              <h3 className="font-semibold text-slate-900">
                System Health
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Review database and system-wide statistics.
              </p>

              <p className="mt-4 text-sm font-semibold text-blue-600">
                View Health →
              </p>
            </Link>

            <Link
              href="/admin/question-bank"
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:bg-blue-50"
            >
              <h3 className="font-semibold text-slate-900">
                Question Bank
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Monitor question counts, difficulty, status,
                and subject coverage.
              </p>

              <p className="mt-4 text-sm font-semibold text-blue-600">
                View Question Bank →
              </p>
            </Link>

            <Link
              href="/admin/usage"
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:bg-blue-50"
            >
              <h3 className="font-semibold text-slate-900">
                Usage Statistics
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Review student activity, exam attempts,
                answers, and subject usage.
              </p>

              <p className="mt-4 text-sm font-semibold text-blue-600">
                View Usage →
              </p>
            </Link>

            <Link
              href="/admin/subscription-health"
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:bg-blue-50"
            >
              <h3 className="font-semibold text-slate-900">
                Subscription Health
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Monitor active, expired, cancelled, pending,
                and expiring subscriptions.
              </p>

              <p className="mt-4 text-sm font-semibold text-blue-600">
                View Subscription Health →
              </p>
            </Link>

            <Link
              href="/admin/payment-health"
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:bg-blue-50"
            >
              <h3 className="font-semibold text-slate-900">
                Payment Health
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Monitor payment success, failures, pending
                transactions, and revenue.
              </p>

              <p className="mt-4 text-sm font-semibold text-blue-600">
                View Payment Health →
              </p>
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
