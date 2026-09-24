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
  // Dashboard statistics
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

  const analyticsData = Array.from(
    { length: 6 },
    (_, index) => {
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
        revenue: Number(
          monthlyRevenue.toFixed(2)
        ),
        averagePercentage: Number(
          averagePercentage.toFixed(2)
        ),
      };
    }
  );

  // ---------------------------------------------------------
  // Dashboard statistic cards
  // ---------------------------------------------------------

  const statistics = [
    {
      label: "Total Students",
      value: totalStudents,
      href: "/admin/students",
      description: "Registered student accounts",
      icon: "👥",
      tone: "blue",
    },
    {
      label: "Total Subjects",
      value: totalSubjects,
      href: "/admin/subjects",
      description: "Available subjects",
      icon: "📚",
      tone: "green",
    },
    {
      label: "Total Questions",
      value: totalQuestions,
      href: "/admin/questions",
      description: "Questions in the system",
      icon: "❓",
      tone: "blue",
    },
    {
      label: "Total Exams",
      value: totalExams,
      href: "/admin/exams",
      description: "Student exams created",
      icon: "📝",
      tone: "green",
    },
    {
      label: "Completed Results",
      value: totalResults,
      href: "/admin/results",
      description: "Marked examination results",
      icon: "✓",
      tone: "blue",
    },
    {
      label: "Active Subscriptions",
      value: activeSubscriptions,
      href: "/admin/subscriptions",
      description: "Currently active subscriptions",
      icon: "✓",
      tone: "green",
    },
    {
      label: "Successful Payments",
      value: successfulPayments,
      href: "/admin/payments",
      description: "Successfully processed payments",
      icon: "₵",
      tone: "green",
    },
    {
      label: "Pending Payments",
      value: pendingPayments,
      href: "/admin/payments",
      description: "Payments awaiting processing",
      icon: "!",
      tone: "red",
    },
  ];

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-lg font-bold text-white shadow-sm">
                  SP
                </div>

                <div>
                  <p className="text-sm font-bold text-blue-600">
                    Student Prep Administration
                  </p>

                  <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                    Admin Dashboard
                  </h1>
                </div>
              </div>

              <p className="mt-3 text-sm text-slate-500">
                Welcome back,{" "}
                <span className="font-semibold text-slate-700">
                  {admin.firstName} {admin.lastName}
                </span>
                .
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-2 text-xs font-semibold text-green-700">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                Admin access active
              </span>

              <Link
                href="/admin/question-imports"
                className="inline-flex w-fit items-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Question Imports
              </Link>

              <Link
                href="/admin/health"
                className="inline-flex w-fit items-center rounded-lg border border-green-200 bg-green-50 px-4 py-2.5 text-sm font-semibold text-green-700 transition hover:bg-green-100"
              >
                System Health
              </Link>

              <Link
                href="/dashboard"
                className="inline-flex w-fit items-center rounded-lg border border-blue-200 bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
              >
                Student Dashboard
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* System Overview */}
        <section>
          <div className="mb-5">
            <div className="flex items-center gap-3">
              <div className="h-8 w-1 rounded-full bg-blue-600" />

              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  System Overview
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Current statistics from the Student Prep platform.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {statistics.map((stat) => (
              <Link
                key={stat.label}
                href={stat.href}
                className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl text-lg font-bold ${
                      stat.tone === "green"
                        ? "bg-green-100 text-green-700"
                        : stat.tone === "red"
                          ? "bg-red-100 text-red-700"
                          : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {stat.icon}
                  </div>

                  {stat.tone === "red" && (
                    <span className="rounded-full bg-red-50 px-2 py-1 text-xs font-semibold text-red-700">
                      Attention
                    </span>
                  )}
                </div>

                <p className="mt-5 text-sm font-medium text-slate-500">
                  {stat.label}
                </p>

                <p className="mt-1 text-3xl font-bold text-slate-900">
                  {stat.value.toLocaleString()}
                </p>

                <p className="mt-2 text-xs text-slate-500">
                  {stat.description}
                </p>

                <p className="mt-4 text-sm font-semibold text-blue-600 transition group-hover:text-blue-700">
                  View details →
                </p>
              </Link>
            ))}
          </div>
        </section>

        {/* Payment Revenue */}
        <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 font-bold text-green-700">
                    ₵
                  </div>

                  <div>
                    <h2 className="text-xl font-bold text-slate-900">
                      Payment Revenue
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Total value of successfully processed payments.
                    </p>
                  </div>
                </div>
              </div>

              <Link
                href="/admin/payments"
                className="text-sm font-semibold text-blue-600 hover:text-blue-700"
              >
                View Payments →
              </Link>
            </div>
          </div>

          <div className="p-6">
            <div className="rounded-xl border border-green-200 bg-green-50 p-6">
              <p className="text-sm font-semibold text-green-700">
                Successful Payment Revenue
              </p>

              <p className="mt-2 text-3xl font-bold text-slate-900">
                GHS {revenue.toFixed(2)}
              </p>

              <p className="mt-2 text-xs text-green-700">
                Based on successfully processed payments.
              </p>
            </div>
          </div>
        </section>

        {/* Analytics */}
        <AdminAnalytics data={analyticsData} />

        {/* Administration */}
        <section className="mt-8">
          <div className="mb-5">
            <div className="flex items-center gap-3">
              <div className="h-8 w-1 rounded-full bg-blue-600" />

              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Administration
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Manage the main platform resources.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                href: "/admin/students",
                label: "Manage Students",
                icon: "👥",
                tone: "blue",
              },
              {
                href: "/admin/subjects",
                label: "Manage Subjects",
                icon: "📚",
                tone: "green",
              },
              {
                href: "/admin/questions",
                label: "Manage Questions",
                icon: "❓",
                tone: "blue",
              },
              {
                href: "/admin/exams",
                label: "Manage Exams",
                icon: "📝",
                tone: "green",
              },
              {
                href: "/admin/results",
                label: "Manage Results",
                icon: "✓",
                tone: "blue",
              },
              {
                href: "/admin/subscriptions",
                label: "Manage Subscriptions",
                icon: "💳",
                tone: "green",
              },
              {
                href: "/admin/payments",
                label: "Manage Payments",
                icon: "₵",
                tone: "blue",
              },
              {
                href: "/admin/question-imports",
                label: "Import Questions",
                icon: "⬆",
                tone: "blue",
              },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50 hover:shadow-md"
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg text-lg font-bold ${
                    item.tone === "green"
                      ? "bg-green-100 text-green-700"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {item.icon}
                </div>

                <p className="mt-4 text-sm font-semibold text-slate-800 group-hover:text-blue-700">
                  {item.label}
                </p>

                <p className="mt-2 text-xs text-slate-500">
                  Open management area →
                </p>
              </Link>
            ))}
          </div>
        </section>

        {/* Platform Health & Reports */}
        <section className="mt-8">
          <div className="mb-5">
            <div className="flex items-center gap-3">
              <div className="h-8 w-1 rounded-full bg-green-600" />

              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Platform Health & Reports
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Monitor platform health, usage, content quality,
                  subscriptions, and payments.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              href="/admin/health"
              className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 font-bold text-green-700">
                ✓
              </div>

              <h3 className="mt-4 font-semibold text-slate-900 group-hover:text-blue-700">
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
              className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 font-bold text-blue-700">
                ?
              </div>

              <h3 className="mt-4 font-semibold text-slate-900 group-hover:text-blue-700">
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
              className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 font-bold text-blue-700">
                ↗
              </div>

              <h3 className="mt-4 font-semibold text-slate-900 group-hover:text-blue-700">
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
              className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 font-bold text-green-700">
                ✓
              </div>

              <h3 className="mt-4 font-semibold text-slate-900 group-hover:text-blue-700">
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
              className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 font-bold text-green-700">
                ₵
              </div>

              <h3 className="mt-4 font-semibold text-slate-900 group-hover:text-blue-700">
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