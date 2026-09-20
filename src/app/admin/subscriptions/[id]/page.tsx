import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import CancelSubscriptionButton from "./CancelSubscriptionButton";
import ExpireSubscriptionButton from "./ExpireSubscriptionButton";
import RenewSubscriptionButton from "./RenewSubscriptionButton";

interface SubscriptionDetailsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function SubscriptionDetailsPage({
  params,
}: SubscriptionDetailsPageProps) {
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
      isActive: true,
    },
  });

  if (!admin || !admin.isActive || admin.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const { id } = await params;

  const subscription = await prisma.subscription.findUnique({
    where: {
      id,
    },
    include: {
      user: {
        include: {
          profile: true,
        },
      },
      plan: true,
    },
  });

  if (!subscription) {
    redirect("/admin/subscriptions");
  }

  const payments = await prisma.payment.findMany({
    where: {
      subscriptionId: subscription.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      reference: true,
      amount: true,
      currency: true,
      status: true,
      paidAt: true,
      provider: true,
      createdAt: true,
    },
  });

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Link
            href="/admin/subscriptions"
            className="text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            ← Back to Subscriptions
          </Link>

          <h1 className="mt-3 text-2xl font-bold text-slate-900">
            Subscription Details
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            View subscription information, usage and payment history.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Student Information */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">
              Student Information
            </h2>

            <div className="mt-5 space-y-4">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Name
                </p>

                <p className="mt-1 font-semibold text-slate-900">
                  {subscription.user.firstName}{" "}
                  {subscription.user.lastName}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-500">
                  Email
                </p>

                <p className="mt-1 text-slate-900">
                  {subscription.user.email}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-500">
                  Phone
                </p>

                <p className="mt-1 text-slate-900">
                  {subscription.user.profile?.phone || "Not provided"}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-500">
                  School
                </p>

                <p className="mt-1 text-slate-900">
                  {subscription.user.profile?.school || "Not provided"}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-500">
                  Class Level
                </p>

                <p className="mt-1 text-slate-900">
                  {subscription.user.profile?.classLevel ||
                    "Not provided"}
                </p>
              </div>
            </div>
          </section>

          {/* Subscription Information */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">
              Subscription Information
            </h2>

            <div className="mt-5 space-y-4">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Plan
                </p>

                <p className="mt-1 font-semibold text-slate-900">
                  {subscription.plan.name}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-500">
                  Plan Type
                </p>

                <p className="mt-1 text-slate-900">
                  {subscription.plan.type}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-500">
                  Status
                </p>

                <span
                  className={`mt-1 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                    subscription.status === "ACTIVE"
                      ? "bg-green-100 text-green-700"
                      : subscription.status === "EXPIRED"
                        ? "bg-amber-100 text-amber-700"
                        : subscription.status === "CANCELLED"
                          ? "bg-red-100 text-red-700"
                          : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {subscription.status}
                </span>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-500">
                  Started
                </p>

                <p className="mt-1 text-slate-900">
                  {subscription.startedAt
                    ? subscription.startedAt.toLocaleString()
                    : "Not started"}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-500">
                  Expires
                </p>

                <p className="mt-1 text-slate-900">
                  {subscription.expiresAt
                    ? subscription.expiresAt.toLocaleString()
                    : "No expiry"}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-500">
                  Payment Required
                </p>

                <p className="mt-1 text-slate-900">
                  {subscription.paymentRequired ? "Yes" : "No"}
                </p>
              </div>
            </div>
          </section>

          {/* Usage */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">
              Usage
            </h2>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-sm font-medium text-slate-500">
                  Tests Used
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {subscription.testsUsed}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-sm font-medium text-slate-500">
                  Free Tests Used
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {subscription.freeTestsUsed}
                </p>
              </div>
            </div>
          </section>

          {/* Plan Details */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">
              Plan Details
            </h2>

            <div className="mt-5 space-y-4">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Price
                </p>

                <p className="mt-1 font-semibold text-slate-900">
                  GHS {subscription.plan.price.toString()}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-500">
                  Duration
                </p>

                <p className="mt-1 text-slate-900">
                  {subscription.plan.durationDays
                    ? `${subscription.plan.durationDays} days`
                    : "No expiry"}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-500">
                  Tests Allowed
                </p>

                <p className="mt-1 text-slate-900">
                  {subscription.plan.unlimitedTests
                    ? "Unlimited"
                    : subscription.plan.testsAllowed ?? "Not specified"}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-500">
                  Description
                </p>

                <p className="mt-1 leading-7 text-slate-600">
                  {subscription.plan.description ||
                    "No description available."}
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Payments */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">
            Related Payments
          </h2>

          {payments.length === 0 ? (
            <div className="mt-5 rounded-xl bg-slate-50 p-5 text-sm text-slate-600">
              No payment records are linked to this subscription.
            </div>
          ) : (
            <div className="mt-5 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="px-4 py-3 font-semibold text-slate-700">
                      Reference
                    </th>

                    <th className="px-4 py-3 font-semibold text-slate-700">
                      Amount
                    </th>

                    <th className="px-4 py-3 font-semibold text-slate-700">
                      Status
                    </th>

                    <th className="px-4 py-3 font-semibold text-slate-700">
                      Provider
                    </th>

                    <th className="px-4 py-3 font-semibold text-slate-700">
                      Paid At
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {payments.map((payment) => (
                    <tr
                      key={payment.id}
                      className="border-b border-slate-100"
                    >
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {payment.reference}
                      </td>

                      <td className="px-4 py-3 text-slate-700">
                        {payment.currency}{" "}
                        {payment.amount.toString()}
                      </td>

                      <td className="px-4 py-3">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                          {payment.status}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-slate-700">
                        {payment.provider || "—"}
                      </td>

                      <td className="px-4 py-3 text-slate-700">
                        {payment.paidAt
                          ? payment.paidAt.toLocaleString()
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Actions */}
        <div className="mt-8 flex flex-wrap items-start gap-3">
          <Link
            href="/admin/subscriptions"
            className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            ← Back to Subscriptions
          </Link>

          <CancelSubscriptionButton
            subscriptionId={subscription.id}
            status={subscription.status}
          />

          <ExpireSubscriptionButton
            subscriptionId={subscription.id}
            status={subscription.status}
          />

          <RenewSubscriptionButton
            subscriptionId={subscription.id}
            status={subscription.status}
          />
        </div>
      </div>
    </main>
  );
}