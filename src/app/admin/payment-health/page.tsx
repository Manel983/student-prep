import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export default async function PaymentHealthPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const [
    totalPayments,
    successfulPayments,
    pendingPayments,
    failedPayments,
    refundedPayments,
    successfulRevenue,
    paystackPayments,
    paymentsWithoutProvider,
    recentSuccessfulPayments,
    recentPendingPayments,
    recentFailedPayments,
  ] = await Promise.all([
    prisma.payment.count(),

    prisma.payment.count({
      where: {
        status: "SUCCESS",
      },
    }),

    prisma.payment.count({
      where: {
        status: "PENDING",
      },
    }),

    prisma.payment.count({
      where: {
        status: "FAILED",
      },
    }),

    prisma.payment.count({
      where: {
        status: "REFUNDED",
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

    prisma.payment.count({
      where: {
        provider: "paystack",
      },
    }),

    prisma.payment.count({
      where: {
        OR: [
          {
            provider: null,
          },
          {
            provider: "",
          },
        ],
      },
    }),

    prisma.payment.findMany({
      where: {
        status: "SUCCESS",
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        paidAt: "desc",
      },
      take: 8,
    }),

    prisma.payment.findMany({
      where: {
        status: "PENDING",
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
      take: 8,
    }),

    prisma.payment.findMany({
      where: {
        status: "FAILED",
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 8,
    }),
  ]);

  const revenue = Number(successfulRevenue._sum.amount ?? 0);

  const unresolvedPayments = pendingPayments + failedPayments;

  const successRate =
    totalPayments > 0
      ? (successfulPayments / totalPayments) * 100
      : 0;

  const formatDate = (date: Date | null) => {
    if (!date) {
      return "—";
    }

    return new Intl.DateTimeFormat("en-GH", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  };

  const formatAmount = (amount: unknown) => {
    return `GHS ${Number(amount ?? 0).toFixed(2)}`;
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <Link
              href="/admin"
              className="text-sm font-semibold text-blue-600 transition hover:text-blue-700"
            >
              ← Back to Admin Dashboard
            </Link>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <img
                src="/logo.jpg"
                alt="Student Prep"
                className="h-10 w-auto object-contain"
              />

              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Payment Health
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  Monitor payment activity, revenue, providers, and
                  transactions requiring attention.
                </p>
              </div>
            </div>
          </div>

          <Link
            href="/admin/payments"
            className="hidden rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 sm:inline-flex"
          >
            Manage Payments
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Health Banner */}
        <section className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-green-500" />

                <p className="text-sm font-bold text-blue-900">
                  Payment monitoring active
                </p>
              </div>

              <p className="mt-1 text-sm text-blue-800">
                Review successful, pending, failed, refunded, and
                provider-related payment activity below.
              </p>
            </div>

            <div className="rounded-full border border-blue-200 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700">
              Admin Monitoring
            </div>
          </div>
        </section>

        {/* Overview */}
        <section className="mt-8">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Payment Overview
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Current payment status distribution across the platform.
            </p>
          </div>

          <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {/* Total */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-slate-500">
                  Total Payments
                </p>

                <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">
                  ALL
                </span>
              </div>

              <p className="mt-3 text-3xl font-bold text-slate-900">
                {totalPayments}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                All recorded transactions
              </p>
            </div>

            {/* Successful */}
            <div className="rounded-2xl border border-green-200 bg-green-50 p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-green-700">
                  Successful
                </p>

                <span className="rounded-full bg-white px-2 py-1 text-xs font-bold text-green-700">
                  OK
                </span>
              </div>

              <p className="mt-3 text-3xl font-bold text-green-800">
                {successfulPayments}
              </p>

              <p className="mt-1 text-xs text-green-700">
                Completed successfully
              </p>
            </div>

            {/* Pending */}
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-blue-700">
                  Pending
                </p>

                <span className="rounded-full bg-white px-2 py-1 text-xs font-bold text-blue-700">
                  WAIT
                </span>
              </div>

              <p className="mt-3 text-3xl font-bold text-blue-800">
                {pendingPayments}
              </p>

              <p className="mt-1 text-xs text-blue-700">
                Awaiting final status
              </p>
            </div>

            {/* Failed */}
            <div className="rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-red-700">
                  Failed
                </p>

                <span className="rounded-full bg-white px-2 py-1 text-xs font-bold text-red-700">
                  ATTENTION
                </span>
              </div>

              <p className="mt-3 text-3xl font-bold text-red-800">
                {failedPayments}
              </p>

              <p className="mt-1 text-xs text-red-700">
                Transactions that failed
              </p>
            </div>

            {/* Refunded */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-slate-500">
                  Refunded
                </p>

                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">
                  REFUND
                </span>
              </div>

              <p className="mt-3 text-3xl font-bold text-slate-800">
                {refundedPayments}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Returned transactions
              </p>
            </div>
          </div>
        </section>

        {/* Revenue and Health */}
        <section className="mt-8">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Payment Health
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Key indicators showing the current payment position.
            </p>
          </div>

          <div className="mt-4 grid gap-5 md:grid-cols-3">
            {/* Revenue */}
            <div className="rounded-2xl border border-green-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Successful Revenue
                  </p>

                  <p className="mt-2 text-3xl font-bold text-green-700">
                    {formatAmount(revenue)}
                  </p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 text-sm font-bold text-green-700">
                  GHS
                </div>
              </div>

              <p className="mt-3 text-xs text-slate-500">
                Successful payments only
              </p>
            </div>

            {/* Success Rate */}
            <div className="rounded-2xl border border-blue-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Success Rate
                  </p>

                  <p className="mt-2 text-3xl font-bold text-blue-700">
                    {successRate.toFixed(2)}%
                  </p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-sm font-bold text-blue-700">
                  %
                </div>
              </div>

              <p className="mt-3 text-xs text-slate-500">
                Successful payments ÷ total payments
              </p>
            </div>

            {/* Attention */}
            <div
              className={`rounded-2xl border bg-white p-6 shadow-sm ${
                unresolvedPayments > 0
                  ? "border-red-200"
                  : "border-green-200"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Payments Requiring Attention
                  </p>

                  <p
                    className={`mt-2 text-3xl font-bold ${
                      unresolvedPayments > 0
                        ? "text-red-700"
                        : "text-green-700"
                    }`}
                  >
                    {unresolvedPayments}
                  </p>
                </div>

                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold ${
                    unresolvedPayments > 0
                      ? "bg-red-100 text-red-700"
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  !
                </div>
              </div>

              <p className="mt-3 text-xs text-slate-500">
                Pending + failed payments
              </p>
            </div>
          </div>
        </section>

        {/* Provider Health */}
        <section className="mt-8">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Payment Provider
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Provider coverage and records that may need investigation.
            </p>
          </div>

          <div className="mt-4 grid gap-5 md:grid-cols-2">
            {/* Paystack */}
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-blue-700">
                    Paystack Payments
                  </p>

                  <p className="mt-2 text-3xl font-bold text-blue-800">
                    {paystackPayments}
                  </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-sm font-black text-blue-700">
                  P
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-green-500" />

                <p className="text-xs font-medium text-blue-700">
                  Provider recorded as paystack
                </p>
              </div>
            </div>

            {/* Missing Provider */}
            <div
              className={`rounded-2xl border p-6 shadow-sm ${
                paymentsWithoutProvider > 0
                  ? "border-red-200 bg-red-50"
                  : "border-green-200 bg-green-50"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p
                    className={`text-sm font-medium ${
                      paymentsWithoutProvider > 0
                        ? "text-red-700"
                        : "text-green-700"
                    }`}
                  >
                    Missing Provider
                  </p>

                  <p
                    className={`mt-2 text-3xl font-bold ${
                      paymentsWithoutProvider > 0
                        ? "text-red-800"
                        : "text-green-800"
                    }`}
                  >
                    {paymentsWithoutProvider}
                  </p>
                </div>

                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl bg-white text-sm font-black ${
                    paymentsWithoutProvider > 0
                      ? "text-red-700"
                      : "text-green-700"
                  }`}
                >
                  {paymentsWithoutProvider > 0 ? "!" : "✓"}
                </div>
              </div>

              <p
                className={`mt-4 text-xs ${
                  paymentsWithoutProvider > 0
                    ? "text-red-700"
                    : "text-green-700"
                }`}
              >
                Payments without a provider value
              </p>
            </div>
          </div>
        </section>

        {/* Recent Successful Payments */}
        <section className="mt-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-green-500" />

                <h2 className="text-xl font-bold text-slate-900">
                  Recent Successful Payments
                </h2>
              </div>

              <p className="mt-1 text-sm text-slate-500">
                The latest successful payment transactions.
              </p>
            </div>

            <Link
              href="/admin/payments?status=SUCCESS"
              className="text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              View all →
            </Link>
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl border border-green-200 bg-white shadow-sm">
            {recentSuccessfulPayments.length === 0 ? (
              <div className="bg-green-50 p-6 text-sm text-green-700">
                No successful payments found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="border-b border-green-200 bg-green-50">
                    <tr>
                      <th className="px-5 py-3 text-left font-semibold text-green-800">
                        Student
                      </th>

                      <th className="px-5 py-3 text-left font-semibold text-green-800">
                        Reference
                      </th>

                      <th className="px-5 py-3 text-left font-semibold text-green-800">
                        Amount
                      </th>

                      <th className="px-5 py-3 text-left font-semibold text-green-800">
                        Paid At
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {recentSuccessfulPayments.map((payment) => (
                      <tr
                        key={payment.id}
                        className="transition hover:bg-green-50/40"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-700">
                              {getInitials(
                                payment.user.firstName,
                                payment.user.lastName
                              )}
                            </div>

                            <div>
                              <p className="font-medium text-slate-900">
                                {payment.user.firstName}{" "}
                                {payment.user.lastName}
                              </p>

                              <p className="text-xs text-slate-500">
                                {payment.user.email}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4 font-mono text-xs text-slate-600">
                          {payment.reference}
                        </td>

                        <td className="px-5 py-4">
                          <span className="font-semibold text-green-700">
                            {formatAmount(payment.amount)}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-slate-600">
                          {formatDate(payment.paidAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* Pending Payments */}
        <section className="mt-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />

              <h2 className="text-xl font-bold text-slate-900">
                Pending Payments
              </h2>
            </div>

            <p className="mt-1 text-sm text-slate-500">
              Payments that have not yet reached a successful state.
            </p>
          </div>

          <div
            className={`mt-4 overflow-hidden rounded-2xl border bg-white shadow-sm ${
              recentPendingPayments.length > 0
                ? "border-blue-200"
                : "border-green-200"
            }`}
          >
            {recentPendingPayments.length === 0 ? (
              <div className="bg-green-50 p-6 text-sm text-green-700">
                ✓ No pending payments found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="border-b border-blue-200 bg-blue-50">
                    <tr>
                      <th className="px-5 py-3 text-left font-semibold text-blue-800">
                        Student
                      </th>

                      <th className="px-5 py-3 text-left font-semibold text-blue-800">
                        Reference
                      </th>

                      <th className="px-5 py-3 text-left font-semibold text-blue-800">
                        Amount
                      </th>

                      <th className="px-5 py-3 text-left font-semibold text-blue-800">
                        Created
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {recentPendingPayments.map((payment) => (
                      <tr
                        key={payment.id}
                        className="transition hover:bg-blue-50/40"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                              {getInitials(
                                payment.user.firstName,
                                payment.user.lastName
                              )}
                            </div>

                            <div>
                              <p className="font-medium text-slate-900">
                                {payment.user.firstName}{" "}
                                {payment.user.lastName}
                              </p>

                              <p className="text-xs text-slate-500">
                                {payment.user.email}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4 font-mono text-xs text-slate-600">
                          {payment.reference}
                        </td>

                        <td className="px-5 py-4 font-semibold text-blue-700">
                          {formatAmount(payment.amount)}
                        </td>

                        <td className="px-5 py-4 text-slate-600">
                          {formatDate(payment.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* Failed Payments */}
        <section className="mt-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500" />

              <h2 className="text-xl font-bold text-slate-900">
                Recent Failed Payments
              </h2>
            </div>

            <p className="mt-1 text-sm text-slate-500">
              Recent transactions recorded with a failed payment status.
            </p>
          </div>

          <div
            className={`mt-4 overflow-hidden rounded-2xl border bg-white shadow-sm ${
              recentFailedPayments.length > 0
                ? "border-red-200"
                : "border-green-200"
            }`}
          >
            {recentFailedPayments.length === 0 ? (
              <div className="bg-green-50 p-6 text-sm text-green-700">
                ✓ No failed payments found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="border-b border-red-200 bg-red-50">
                    <tr>
                      <th className="px-5 py-3 text-left font-semibold text-red-800">
                        Student
                      </th>

                      <th className="px-5 py-3 text-left font-semibold text-red-800">
                        Reference
                      </th>

                      <th className="px-5 py-3 text-left font-semibold text-red-800">
                        Amount
                      </th>

                      <th className="px-5 py-3 text-left font-semibold text-red-800">
                        Updated
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {recentFailedPayments.map((payment) => (
                      <tr
                        key={payment.id}
                        className="transition hover:bg-red-50/40"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-700">
                              {getInitials(
                                payment.user.firstName,
                                payment.user.lastName
                              )}
                            </div>

                            <div>
                              <p className="font-medium text-slate-900">
                                {payment.user.firstName}{" "}
                                {payment.user.lastName}
                              </p>

                              <p className="text-xs text-slate-500">
                                {payment.user.email}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4 font-mono text-xs text-slate-600">
                          {payment.reference}
                        </td>

                        <td className="px-5 py-4 font-semibold text-red-700">
                          {formatAmount(payment.amount)}
                        </td>

                        <td className="px-5 py-4 text-slate-600">
                          {formatDate(payment.updatedAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* Navigation */}
        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2">
            <h2 className="text-lg font-bold text-slate-900">
              Payment Management
            </h2>

            <p className="text-sm text-slate-500">
              Continue managing transactions, subscriptions, or the wider
              administration area.
            </p>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/admin/payments"
              className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Manage Payments
            </Link>

            <Link
              href="/admin/subscriptions"
              className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
            >
              View Subscriptions
            </Link>

            <Link
              href="/admin"
              className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Admin Dashboard
            </Link>
          </div>
        </section>

        {/* Mobile Manage Payments */}
        <div className="mt-5 sm:hidden">
          <Link
            href="/admin/payments"
            className="block rounded-lg bg-blue-600 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Manage Payments
          </Link>
        </div>
      </div>
    </main>
  );
}