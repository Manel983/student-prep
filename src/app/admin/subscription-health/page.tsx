import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export default async function SubscriptionHealthPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const now = new Date();

  const sevenDaysFromNow = new Date(now);
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

  const [
    totalSubscriptions,
    activeSubscriptions,
    expiredSubscriptions,
    cancelledSubscriptions,
    pendingSubscriptions,
    freeSubscriptions,
    monthlySubscriptions,
    sixMonthSubscriptions,
    yearlySubscriptions,
    expiringSoon,
    expiredPaidSubscriptions,
  ] = await Promise.all([
    prisma.subscription.count(),

    prisma.subscription.count({
      where: {
        status: "ACTIVE",
      },
    }),

    prisma.subscription.count({
      where: {
        status: "EXPIRED",
      },
    }),

    prisma.subscription.count({
      where: {
        status: "CANCELLED",
      },
    }),

    prisma.subscription.count({
      where: {
        status: "PENDING",
      },
    }),

    prisma.subscription.count({
      where: {
        plan: {
          type: "FREE",
        },
      },
    }),

    prisma.subscription.count({
      where: {
        plan: {
          type: "MONTHLY",
        },
      },
    }),

    prisma.subscription.count({
      where: {
        plan: {
          type: "SIX_MONTHS",
        },
      },
    }),

    prisma.subscription.count({
      where: {
        plan: {
          type: "YEARLY",
        },
      },
    }),

    prisma.subscription.count({
      where: {
        status: "ACTIVE",
        expiresAt: {
          gte: now,
          lte: sevenDaysFromNow,
        },
      },
    }),

    prisma.subscription.count({
      where: {
        status: "EXPIRED",
        plan: {
          type: {
            not: "FREE",
          },
        },
      },
    }),
  ]);

  const paidSubscriptions =
    monthlySubscriptions +
    sixMonthSubscriptions +
    yearlySubscriptions;

  const activePaidSubscriptions = await prisma.subscription.count({
    where: {
      status: "ACTIVE",
      plan: {
        type: {
          in: ["MONTHLY", "SIX_MONTHS", "YEARLY"],
        },
      },
    },
  });

  const activeFreeSubscriptions = await prisma.subscription.count({
    where: {
      status: "ACTIVE",
      plan: {
        type: "FREE",
      },
    },
  });

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
              Subscription Health
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Overview of subscription status, plans, and subscriptions
              requiring attention.
            </p>
          </div>

          <Link
            href="/admin/subscriptions"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Manage Subscriptions
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Overview */}
        <section>
          <h2 className="text-xl font-bold text-slate-900">
            Subscription Overview
          </h2>

          <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-slate-500">
                Total Subscriptions
              </p>

              <p className="mt-2 text-3xl font-bold text-slate-900">
                {totalSubscriptions}
              </p>
            </div>

            <div className="rounded-2xl border border-green-200 bg-green-50 p-5 shadow-sm">
              <p className="text-sm font-medium text-green-700">
                Active
              </p>

              <p className="mt-2 text-3xl font-bold text-green-800">
                {activeSubscriptions}
              </p>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
              <p className="text-sm font-medium text-amber-700">
                Expiring Soon
              </p>

              <p className="mt-2 text-3xl font-bold text-amber-800">
                {expiringSoon}
              </p>

              <p className="mt-1 text-xs text-amber-700">
                Within 7 days
              </p>
            </div>

            <div className="rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm">
              <p className="text-sm font-medium text-red-700">
                Expired
              </p>

              <p className="mt-2 text-3xl font-bold text-red-800">
                {expiredSubscriptions}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-slate-500">
                Cancelled
              </p>

              <p className="mt-2 text-3xl font-bold text-slate-800">
                {cancelledSubscriptions}
              </p>
            </div>
          </div>
        </section>

        {/* Status Breakdown */}
        <section className="mt-8">
          <h2 className="text-xl font-bold text-slate-900">
            Status Breakdown
          </h2>

          <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-green-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-slate-500">
                Active
              </p>

              <p className="mt-2 text-2xl font-bold text-green-700">
                {activeSubscriptions}
              </p>
            </div>

            <div className="rounded-2xl border border-red-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-slate-500">
                Expired
              </p>

              <p className="mt-2 text-2xl font-bold text-red-700">
                {expiredSubscriptions}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-slate-500">
                Cancelled
              </p>

              <p className="mt-2 text-2xl font-bold text-slate-700">
                {cancelledSubscriptions}
              </p>
            </div>

            <div className="rounded-2xl border border-yellow-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-slate-500">
                Pending
              </p>

              <p className="mt-2 text-2xl font-bold text-yellow-700">
                {pendingSubscriptions}
              </p>
            </div>
          </div>
        </section>

        {/* Plan Breakdown */}
        <section className="mt-8">
          <h2 className="text-xl font-bold text-slate-900">
            Plan Distribution
          </h2>

          <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-slate-500">
                Free
              </p>

              <p className="mt-2 text-3xl font-bold text-slate-900">
                {freeSubscriptions}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                All free subscriptions
              </p>
            </div>

            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
              <p className="text-sm font-medium text-blue-700">
                Monthly
              </p>

              <p className="mt-2 text-3xl font-bold text-blue-800">
                {monthlySubscriptions}
              </p>

              <p className="mt-1 text-xs text-blue-700">
                GHS 10 / month
              </p>
            </div>

            <div className="rounded-2xl border border-purple-200 bg-purple-50 p-5 shadow-sm">
              <p className="text-sm font-medium text-purple-700">
                6 Months
              </p>

              <p className="mt-2 text-3xl font-bold text-purple-800">
                {sixMonthSubscriptions}
              </p>

              <p className="mt-1 text-xs text-purple-700">
                GHS 55 / 6 months
              </p>
            </div>

            <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5 shadow-sm">
              <p className="text-sm font-medium text-indigo-700">
                Yearly
              </p>

              <p className="mt-2 text-3xl font-bold text-indigo-800">
                {yearlySubscriptions}
              </p>

              <p className="mt-1 text-xs text-indigo-700">
                GHS 125 / year
              </p>
            </div>
          </div>
        </section>

        {/* Paid vs Free */}
        <section className="mt-8">
          <h2 className="text-xl font-bold text-slate-900">
            Free vs Paid
          </h2>

          <div className="mt-4 grid gap-5 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-slate-500">
                Paid Subscriptions
              </p>

              <p className="mt-2 text-3xl font-bold text-blue-700">
                {paidSubscriptions}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Monthly + 6 Months + Yearly
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-slate-500">
                Active Paid
              </p>

              <p className="mt-2 text-3xl font-bold text-green-700">
                {activePaidSubscriptions}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-slate-500">
                Active Free
              </p>

              <p className="mt-2 text-3xl font-bold text-slate-700">
                {activeFreeSubscriptions}
              </p>
            </div>
          </div>
        </section>

        {/* Attention Required */}
        <section className="mt-8">
          <h2 className="text-xl font-bold text-slate-900">
            Attention Required
          </h2>

          <div className="mt-4 grid gap-5 md:grid-cols-2">
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
              <h3 className="text-lg font-bold text-amber-900">
                Subscriptions Expiring Soon
              </h3>

              <p className="mt-2 text-sm text-amber-800">
                {expiringSoon} active subscription
                {expiringSoon === 1 ? "" : "s"} will expire within
                the next 7 days.
              </p>

              <Link
                href="/admin/subscriptions"
                className="mt-4 inline-flex rounded-lg border border-amber-300 bg-white px-4 py-2 text-sm font-semibold text-amber-800 transition hover:bg-amber-100"
              >
                Review Subscriptions
              </Link>
            </div>

            <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
              <h3 className="text-lg font-bold text-red-900">
                Expired Paid Subscriptions
              </h3>

              <p className="mt-2 text-sm text-red-800">
                {expiredPaidSubscriptions} paid subscription
                {expiredPaidSubscriptions === 1 ? "" : "s"} are
                currently expired.
              </p>

              <p className="mt-2 text-xs text-red-700">
                These may require review or manual renewal where
                appropriate.
              </p>

              <Link
                href="/admin/subscriptions"
                className="mt-4 inline-flex rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-800 transition hover:bg-red-100"
              >
                Review Expired Subscriptions
              </Link>
            </div>
          </div>
        </section>

        {/* Navigation */}
        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">
            Subscription Management
          </h2>

          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/admin/subscriptions"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Manage Subscriptions
            </Link>

            <Link
              href="/admin/payments"
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              View Payments
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