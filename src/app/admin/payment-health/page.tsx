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
              Payment Health
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Overview of payment activity, revenue, providers, and
              payments requiring attention.
            </p>
          </div>

          <Link
            href="/admin/payments"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Manage Payments
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Overview */}
        <section>
          <h2 className="text-xl font-bold text-slate-900">
            Payment Overview
          </h2>

          <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-slate-500">
                Total Payments
              </p>

              <p className="mt-2 text-3xl font-bold text-slate-900">
                {totalPayments}
              </p>
            </div>

            <div className="rounded-2xl border border-green-200 bg-green-50 p-5 shadow-sm">
              <p className="text-sm font-medium text-green-700">
                Successful
              </p>

              <p className="mt-2 text-3xl font-bold text-green-800">
                {successfulPayments}
              </p>
            </div>

            <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-5 shadow-sm">
              <p className="text-sm font-medium text-yellow-700">
                Pending
              </p>

              <p className="mt-2 text-3xl font-bold text-yellow-800">
                {pendingPayments}
              </p>
            </div>

            <div className="rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm">
              <p className="text-sm font-medium text-red-700">
                Failed
              </p>

              <p className="mt-2 text-3xl font-bold text-red-800">
                {failedPayments}
              </p>
            </div>

            <div className="rounded-2xl border border-purple-200 bg-purple-50 p-5 shadow-sm">
              <p className="text-sm font-medium text-purple-700">
                Refunded
              </p>

              <p className="mt-2 text-3xl font-bold text-purple-800">
                {refundedPayments}
              </p>
            </div>
          </div>
        </section>

        {/* Revenue and Health */}
        <section className="mt-8">
          <h2 className="text-xl font-bold text-slate-900">
            Payment Health
          </h2>

          <div className="mt-4 grid gap-5 md:grid-cols-3">
            <div className="rounded-2xl border border-green-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-500">
                Successful Revenue
              </p>

              <p className="mt-2 text-3xl font-bold text-green-700">
                {formatAmount(revenue)}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Successful payments only
              </p>
            </div>

            <div className="rounded-2xl border border-blue-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-500">
                Success Rate
              </p>

              <p className="mt-2 text-3xl font-bold text-blue-700">
                {successRate.toFixed(2)}%
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Successful payments ÷ total payments
              </p>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-500">
                Payments Requiring Attention
              </p>

              <p className="mt-2 text-3xl font-bold text-amber-700">
                {unresolvedPayments}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Pending + failed payments
              </p>
            </div>
          </div>
        </section>

        {/* Provider Health */}
        <section className="mt-8">
          <h2 className="text-xl font-bold text-slate-900">
            Payment Provider
          </h2>

          <div className="mt-4 grid gap-5 md:grid-cols-2">
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6 shadow-sm">
              <p className="text-sm font-medium text-blue-700">
                Paystack Payments
              </p>

              <p className="mt-2 text-3xl font-bold text-blue-800">
                {paystackPayments}
              </p>

              <p className="mt-1 text-xs text-blue-700">
                Payments recorded with provider = paystack
              </p>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
              <p className="text-sm font-medium text-amber-700">
                Missing Provider
              </p>

              <p className="mt-2 text-3xl font-bold text-amber-800">
                {paymentsWithoutProvider}
              </p>

              <p className="mt-1 text-xs text-amber-700">
                Payments without a provider value
              </p>
            </div>
          </div>
        </section>

        {/* Recent Successful Payments */}
        <section className="mt-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Recent Successful Payments
              </h2>

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

          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {recentSuccessfulPayments.length === 0 ? (
              <div className="p-6 text-sm text-slate-500">
                No successful payments found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50">
                    <tr>
                      <th className="px-5 py-3 text-left font-semibold text-slate-600">
                        Student
                      </th>
                      <th className="px-5 py-3 text-left font-semibold text-slate-600">
                        Reference
                      </th>
                      <th className="px-5 py-3 text-left font-semibold text-slate-600">
                        Amount
                      </th>
                      <th className="px-5 py-3 text-left font-semibold text-slate-600">
                        Paid At
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {recentSuccessfulPayments.map((payment) => (
                      <tr key={payment.id}>
                        <td className="px-5 py-4">
                          <p className="font-medium text-slate-900">
                            {payment.user.firstName}{" "}
                            {payment.user.lastName}
                          </p>

                          <p className="text-xs text-slate-500">
                            {payment.user.email}
                          </p>
                        </td>

                        <td className="px-5 py-4 font-mono text-xs text-slate-600">
                          {payment.reference}
                        </td>

                        <td className="px-5 py-4 font-semibold text-green-700">
                          {formatAmount(payment.amount)}
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
            <h2 className="text-xl font-bold text-slate-900">
              Pending Payments
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Payments that have not yet reached a successful state.
            </p>
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl border border-yellow-200 bg-white shadow-sm">
            {recentPendingPayments.length === 0 ? (
              <div className="bg-green-50 p-6 text-sm text-green-700">
                No pending payments found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="border-b border-yellow-200 bg-yellow-50">
                    <tr>
                      <th className="px-5 py-3 text-left font-semibold text-yellow-800">
                        Student
                      </th>
                      <th className="px-5 py-3 text-left font-semibold text-yellow-800">
                        Reference
                      </th>
                      <th className="px-5 py-3 text-left font-semibold text-yellow-800">
                        Amount
                      </th>
                      <th className="px-5 py-3 text-left font-semibold text-yellow-800">
                        Created
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {recentPendingPayments.map((payment) => (
                      <tr key={payment.id}>
                        <td className="px-5 py-4">
                          <p className="font-medium text-slate-900">
                            {payment.user.firstName}{" "}
                            {payment.user.lastName}
                          </p>

                          <p className="text-xs text-slate-500">
                            {payment.user.email}
                          </p>
                        </td>

                        <td className="px-5 py-4 font-mono text-xs text-slate-600">
                          {payment.reference}
                        </td>

                        <td className="px-5 py-4 font-semibold text-yellow-700">
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
            <h2 className="text-xl font-bold text-slate-900">
              Recent Failed Payments
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Recent transactions recorded with a failed payment status.
            </p>
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl border border-red-200 bg-white shadow-sm">
            {recentFailedPayments.length === 0 ? (
              <div className="bg-green-50 p-6 text-sm text-green-700">
                No failed payments found.
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
                      <tr key={payment.id}>
                        <td className="px-5 py-4">
                          <p className="font-medium text-slate-900">
                            {payment.user.firstName}{" "}
                            {payment.user.lastName}
                          </p>

                          <p className="text-xs text-slate-500">
                            {payment.user.email}
                          </p>
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
          <h2 className="text-lg font-bold text-slate-900">
            Payment Management
          </h2>

          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/admin/payments"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Manage Payments
            </Link>

            <Link
              href="/admin/subscriptions"
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              View Subscriptions
            </Link>

            <Link
              href="/admin"
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Admin Dashboard
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}