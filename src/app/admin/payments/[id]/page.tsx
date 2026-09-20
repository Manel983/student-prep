import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

interface PaymentDetailsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function PaymentDetailsPage({
  params,
}: PaymentDetailsPageProps) {
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

  if (!id) {
    redirect("/admin/payments");
  }

  const payment = await prisma.payment.findUnique({
    where: {
      id,
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          isActive: true,
          createdAt: true,
        },
      },
    },
  });

  if (!payment) {
    redirect("/admin/payments");
  }

  const subscription = payment.subscriptionId
    ? await prisma.subscription.findUnique({
        where: {
          id: payment.subscriptionId,
        },
        select: {
          id: true,
          status: true,
          startedAt: true,
          expiresAt: true,
          testsUsed: true,
          freeTestsUsed: true,
          paymentRequired: true,
          plan: {
            select: {
              name: true,
              type: true,
              price: true,
              durationDays: true,
              unlimitedTests: true,
              unlimitedQuestions: true,
              testsAllowed: true,
              questionsPerSubject: true,
            },
          },
        },
      })
    : null;

  const metadata =
    payment.metadata &&
    typeof payment.metadata === "object" &&
    !Array.isArray(payment.metadata)
      ? payment.metadata
      : null;

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 lg:px-8">
          <Link
            href="/admin/payments"
            className="text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            ← Back to Payments
          </Link>

          <h1 className="mt-3 text-2xl font-bold text-slate-900">
            Payment Details
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            View payment information and its associated student
            and subscription.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Payment Summary */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Payment Reference
              </p>

              <p className="mt-1 break-all text-lg font-bold text-slate-900">
                {payment.reference}
              </p>
            </div>

            <span
              className={`inline-flex w-fit rounded-full px-3 py-1.5 text-sm font-semibold ${
                payment.status === "SUCCESS"
                  ? "bg-green-100 text-green-700"
                  : payment.status === "FAILED"
                    ? "bg-red-100 text-red-700"
                    : payment.status === "REFUNDED"
                      ? "bg-purple-100 text-purple-700"
                      : "bg-amber-100 text-amber-700"
              }`}
            >
              {payment.status}
            </span>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-500">
                Amount
              </p>

              <p className="mt-2 text-xl font-bold text-slate-900">
                {payment.currency}{" "}
                {Number(payment.amount).toFixed(2)}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-500">
                Provider
              </p>

              <p className="mt-2 font-semibold text-slate-900">
                {payment.provider || "—"}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-500">
                Paid At
              </p>

              <p className="mt-2 font-semibold text-slate-900">
                {payment.paidAt
                  ? payment.paidAt.toLocaleString()
                  : "—"}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-500">
                Created
              </p>

              <p className="mt-2 font-semibold text-slate-900">
                {payment.createdAt.toLocaleString()}
              </p>
            </div>
          </div>
        </section>

        {/* Student Information */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">
            Student Information
          </h2>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Name
              </p>

              <p className="mt-1 font-semibold text-slate-900">
                {payment.user.firstName}{" "}
                {payment.user.lastName}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-500">
                Email
              </p>

              <p className="mt-1 break-all font-semibold text-slate-900">
                {payment.user.email}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-500">
                Account Status
              </p>

              <p
                className={`mt-1 font-semibold ${
                  payment.user.isActive
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {payment.user.isActive
                  ? "Active"
                  : "Inactive"}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-500">
                User ID
              </p>

              <p className="mt-1 break-all font-mono text-sm text-slate-700">
                {payment.user.id}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-500">
                Account Created
              </p>

              <p className="mt-1 text-sm text-slate-700">
                {payment.user.createdAt.toLocaleString()}
              </p>
            </div>
          </div>
        </section>

        {/* Subscription Information */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">
            Subscription Information
          </h2>

          {!subscription ? (
            <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm text-slate-600">
                No subscription is directly associated with
                this payment.
              </p>

              {payment.subscriptionId && (
                <p className="mt-2 break-all font-mono text-xs text-slate-500">
                  Subscription ID: {payment.subscriptionId}
                </p>
              )}
            </div>
          ) : (
            <>
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-sm font-medium text-slate-500">
                    Plan
                  </p>

                  <p className="mt-2 font-bold text-slate-900">
                    {subscription.plan.name}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {subscription.plan.type}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-sm font-medium text-slate-500">
                    Status
                  </p>

                  <p className="mt-2 font-bold text-slate-900">
                    {subscription.status}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-sm font-medium text-slate-500">
                    Started
                  </p>

                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {subscription.startedAt
                      ? subscription.startedAt.toLocaleString()
                      : "—"}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-sm font-medium text-slate-500">
                    Expires
                  </p>

                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {subscription.expiresAt
                      ? subscription.expiresAt.toLocaleString()
                      : "—"}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Tests Used
                  </p>

                  <p className="mt-1 font-semibold text-slate-900">
                    {subscription.testsUsed}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Free Tests Used
                  </p>

                  <p className="mt-1 font-semibold text-slate-900">
                    {subscription.freeTestsUsed}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Payment Required
                  </p>

                  <p className="mt-1 font-semibold text-slate-900">
                    {subscription.paymentRequired
                      ? "Yes"
                      : "No"}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Plan Price
                  </p>

                  <p className="mt-1 font-semibold text-slate-900">
                    GHS{" "}
                    {Number(
                      subscription.plan.price
                    ).toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="mt-5">
                <p className="text-sm font-medium text-slate-500">
                  Subscription ID
                </p>

                <p className="mt-1 break-all font-mono text-sm text-slate-700">
                  {subscription.id}
                </p>
              </div>
            </>
          )}
        </section>

        {/* Payment Metadata */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">
            Payment Metadata
          </h2>

          {!metadata ? (
            <p className="mt-4 text-sm text-slate-500">
              No payment metadata is available.
            </p>
          ) : (
            <pre className="mt-4 overflow-x-auto rounded-xl bg-slate-900 p-5 text-xs leading-6 text-slate-100">
              {JSON.stringify(metadata, null, 2)}
            </pre>
          )}
        </section>

        {/* Navigation */}
        <div className="mt-8">
          <Link
            href="/admin/payments"
            className="inline-flex rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            ← Back to Payments
          </Link>
        </div>
      </div>
    </main>
  );
}