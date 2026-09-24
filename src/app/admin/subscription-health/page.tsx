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

  const subscriptionHealthIssues =
    expiringSoon + expiredPaidSubscriptions + pendingSubscriptions;

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
                className="h-11 w-auto object-contain"
              />

              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Subscription Health
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  Monitor subscription status, plans, activity, and
                  subscriptions requiring attention.
                </p>
              </div>
            </div>
          </div>

          <Link
            href="/admin/subscriptions"
            className="hidden rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 sm:inline-flex"
          >
            Manage Subscriptions
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
                  Subscription monitoring active
                </p>
              </div>

              <p className="mt-1 text-sm text-blue-800">
                Review active, pending, expired, cancelled, and
                plan-specific subscription activity below.
              </p>
            </div>

            <div
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                subscriptionHealthIssues > 0
                  ? "border-red-200 bg-white text-red-700"
                  : "border-green-200 bg-white text-green-700"
              }`}
            >
              {subscriptionHealthIssues > 0
                ? `${subscriptionHealthIssues} item${
                    subscriptionHealthIssues === 1 ? "" : "s"
                  } requiring review`
                : "No immediate issues"}
            </div>
          </div>
        </section>

        {/* Overview */}
        <section className="mt-8">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Subscription Overview
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Current subscription status across the platform.
            </p>
          </div>

          <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {/* Total */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-slate-500">
                  Total Subscriptions
                </p>

                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">
                  ALL
                </span>
              </div>

              <p className="mt-3 text-3xl font-bold text-slate-900">
                {totalSubscriptions}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                All subscription records
              </p>
            </div>

            {/* Active */}
            <div className="rounded-2xl border border-green-200 bg-green-50 p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-green-700">
                  Active
                </p>

                <span className="rounded-full bg-white px-2 py-1 text-xs font-bold text-green-700">
                  ACTIVE
                </span>
              </div>

              <p className="mt-3 text-3xl font-bold text-green-800">
                {activeSubscriptions}
              </p>

              <p className="mt-1 text-xs text-green-700">
                Currently active
              </p>
            </div>

            {/* Expiring Soon */}
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-blue-700">
                  Expiring Soon
                </p>

                <span className="rounded-full bg-white px-2 py-1 text-xs font-bold text-blue-700">
                  7 DAYS
                </span>
              </div>

              <p className="mt-3 text-3xl font-bold text-blue-800">
                {expiringSoon}
              </p>

              <p className="mt-1 text-xs text-blue-700">
                Within the next 7 days
              </p>
            </div>

            {/* Expired */}
            <div className="rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-red-700">
                  Expired
                </p>

                <span className="rounded-full bg-white px-2 py-1 text-xs font-bold text-red-700">
                  REVIEW
                </span>
              </div>

              <p className="mt-3 text-3xl font-bold text-red-800">
                {expiredSubscriptions}
              </p>

              <p className="mt-1 text-xs text-red-700">
                Expired subscriptions
              </p>
            </div>

            {/* Cancelled */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-slate-500">
                  Cancelled
                </p>

                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">
                  CANCELLED
                </span>
              </div>

              <p className="mt-3 text-3xl font-bold text-slate-800">
                {cancelledSubscriptions}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Cancelled subscriptions
              </p>
            </div>
          </div>
        </section>

        {/* Status Breakdown */}
        <section className="mt-8">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Status Breakdown
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Distribution of subscriptions by current status.
            </p>
          </div>

          <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {/* Active */}
            <div className="rounded-2xl border border-green-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-green-500" />

                <p className="text-sm font-medium text-slate-500">
                  Active
                </p>
              </div>

              <p className="mt-3 text-2xl font-bold text-green-700">
                {activeSubscriptions}
              </p>
            </div>

            {/* Expired */}
            <div className="rounded-2xl border border-red-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500" />

                <p className="text-sm font-medium text-slate-500">
                  Expired
                </p>
              </div>

              <p className="mt-3 text-2xl font-bold text-red-700">
                {expiredSubscriptions}
              </p>
            </div>

            {/* Cancelled */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-slate-400" />

                <p className="text-sm font-medium text-slate-500">
                  Cancelled
                </p>
              </div>

              <p className="mt-3 text-2xl font-bold text-slate-700">
                {cancelledSubscriptions}
              </p>
            </div>

            {/* Pending */}
            <div className="rounded-2xl border border-blue-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />

                <p className="text-sm font-medium text-slate-500">
                  Pending
                </p>
              </div>

              <p className="mt-3 text-2xl font-bold text-blue-700">
                {pendingSubscriptions}
              </p>
            </div>
          </div>
        </section>

        {/* Plan Distribution */}
        <section className="mt-8">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Plan Distribution
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Subscription records grouped by plan type.
            </p>
          </div>

          <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {/* Free */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-slate-500">
                  Free
                </p>

                <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">
                  GHS 0
                </span>
              </div>

              <p className="mt-3 text-3xl font-bold text-slate-900">
                {freeSubscriptions}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                All free subscriptions
              </p>
            </div>

            {/* Monthly */}
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-blue-700">
                  Monthly
                </p>

                <span className="rounded-lg bg-white px-2 py-1 text-xs font-bold text-blue-700">
                  GHS 10
                </span>
              </div>

              <p className="mt-3 text-3xl font-bold text-blue-800">
                {monthlySubscriptions}
              </p>

              <p className="mt-1 text-xs text-blue-700">
                GHS 10 / month
              </p>
            </div>

            {/* Six Months */}
            <div className="rounded-2xl border border-blue-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-blue-700">
                  6 Months
                </p>

                <span className="rounded-lg bg-blue-100 px-2 py-1 text-xs font-bold text-blue-700">
                  GHS 55
                </span>
              </div>

              <p className="mt-3 text-3xl font-bold text-blue-800">
                {sixMonthSubscriptions}
              </p>

              <p className="mt-1 text-xs text-blue-700">
                GHS 55 / 6 months
              </p>
            </div>

            {/* Yearly */}
            <div className="rounded-2xl border border-green-200 bg-green-50 p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-green-700">
                  Yearly
                </p>

                <span className="rounded-lg bg-white px-2 py-1 text-xs font-bold text-green-700">
                  GHS 125
                </span>
              </div>

              <p className="mt-3 text-3xl font-bold text-green-800">
                {yearlySubscriptions}
              </p>

              <p className="mt-1 text-xs text-green-700">
                GHS 125 / year
              </p>
            </div>
          </div>
        </section>

        {/* Free vs Paid */}
        <section className="mt-8">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Free vs Paid
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Compare subscription volume across free and paid plans.
            </p>
          </div>

          <div className="mt-4 grid gap-5 md:grid-cols-3">
            {/* Paid */}
            <div className="rounded-2xl border border-blue-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-slate-500">
                  Paid Subscriptions
                </p>

                <span className="rounded-lg bg-blue-100 px-2 py-1 text-xs font-bold text-blue-700">
                  PAID
                </span>
              </div>

              <p className="mt-3 text-3xl font-bold text-blue-700">
                {paidSubscriptions}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Monthly + 6 Months + Yearly
              </p>
            </div>

            {/* Active Paid */}
            <div className="rounded-2xl border border-green-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-slate-500">
                  Active Paid
                </p>

                <span className="rounded-lg bg-green-100 px-2 py-1 text-xs font-bold text-green-700">
                  ACTIVE
                </span>
              </div>

              <p className="mt-3 text-3xl font-bold text-green-700">
                {activePaidSubscriptions}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Currently active paid plans
              </p>
            </div>

            {/* Active Free */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-slate-500">
                  Active Free
                </p>

                <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">
                  FREE
                </span>
              </div>

              <p className="mt-3 text-3xl font-bold text-slate-700">
                {activeFreeSubscriptions}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Currently active free plans
              </p>
            </div>
          </div>
        </section>

        {/* Attention Required */}
        <section className="mt-8">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Attention Required
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Subscription records that may require administrative
              review.
            </p>
          </div>

          <div className="mt-4 grid gap-5 md:grid-cols-2">
            {/* Expiring Soon */}
            <div
              className={`rounded-2xl border p-6 shadow-sm ${
                expiringSoon > 0
                  ? "border-blue-200 bg-blue-50"
                  : "border-green-200 bg-green-50"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3
                    className={`text-lg font-bold ${
                      expiringSoon > 0
                        ? "text-blue-900"
                        : "text-green-900"
                    }`}
                  >
                    Subscriptions Expiring Soon
                  </h3>

                  <p
                    className={`mt-2 text-sm ${
                      expiringSoon > 0
                        ? "text-blue-800"
                        : "text-green-800"
                    }`}
                  >
                    {expiringSoon} active subscription
                    {expiringSoon === 1 ? "" : "s"} will expire
                    within the next 7 days.
                  </p>
                </div>

                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-sm font-bold ${
                    expiringSoon > 0
                      ? "text-blue-700"
                      : "text-green-700"
                  }`}
                >
                  {expiringSoon}
                </div>
              </div>

              <Link
                href="/admin/subscriptions"
                className={`mt-5 inline-flex rounded-lg border bg-white px-4 py-2 text-sm font-semibold transition ${
                  expiringSoon > 0
                    ? "border-blue-300 text-blue-800 hover:bg-blue-100"
                    : "border-green-300 text-green-800 hover:bg-green-100"
                }`}
              >
                Review Subscriptions
              </Link>
            </div>

            {/* Expired Paid */}
            <div
              className={`rounded-2xl border p-6 shadow-sm ${
                expiredPaidSubscriptions > 0
                  ? "border-red-200 bg-red-50"
                  : "border-green-200 bg-green-50"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3
                    className={`text-lg font-bold ${
                      expiredPaidSubscriptions > 0
                        ? "text-red-900"
                        : "text-green-900"
                    }`}
                  >
                    Expired Paid Subscriptions
                  </h3>

                  <p
                    className={`mt-2 text-sm ${
                      expiredPaidSubscriptions > 0
                        ? "text-red-800"
                        : "text-green-800"
                    }`}
                  >
                    {expiredPaidSubscriptions} paid subscription
                    {expiredPaidSubscriptions === 1 ? "" : "s"} are
                    currently expired.
                  </p>

                  <p
                    className={`mt-2 text-xs ${
                      expiredPaidSubscriptions > 0
                        ? "text-red-700"
                        : "text-green-700"
                    }`}
                  >
                    These may require review or manual renewal where
                    appropriate.
                  </p>
                </div>

                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-sm font-bold ${
                    expiredPaidSubscriptions > 0
                      ? "text-red-700"
                      : "text-green-700"
                  }`}
                >
                  {expiredPaidSubscriptions > 0 ? "!" : "✓"}
                </div>
              </div>

              <Link
                href="/admin/subscriptions"
                className={`mt-5 inline-flex rounded-lg border bg-white px-4 py-2 text-sm font-semibold transition ${
                  expiredPaidSubscriptions > 0
                    ? "border-red-300 text-red-800 hover:bg-red-100"
                    : "border-green-300 text-green-800 hover:bg-green-100"
                }`}
              >
                Review Expired Subscriptions
              </Link>
            </div>
          </div>
        </section>

        {/* Navigation */}
        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Subscription Management
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Continue managing subscriptions, payments, or the wider
              administration area.
            </p>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/admin/subscriptions"
              className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Manage Subscriptions
            </Link>

            <Link
              href="/admin/payments"
              className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
            >
              View Payments
            </Link>

            <Link
              href="/admin"
              className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Admin Dashboard
            </Link>
          </div>
        </section>

        {/* Mobile Manage Subscriptions */}
        <div className="mt-5 sm:hidden">
          <Link
            href="/admin/subscriptions"
            className="block rounded-lg bg-blue-600 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Manage Subscriptions
          </Link>
        </div>
      </div>
    </main>
  );
}