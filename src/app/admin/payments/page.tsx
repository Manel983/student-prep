import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

interface PaymentsPageProps {
  searchParams: Promise<{
    search?: string;
    status?: string;
    provider?: string;
  }>;
}

export default async function PaymentsPage({
  searchParams,
}: PaymentsPageProps) {
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

  const params = await searchParams;

  const search = params.search?.trim() || "";
  const status = params.status?.trim() || "";
  const provider = params.provider?.trim() || "";

  const payments = await prisma.payment.findMany({
    where: {
      ...(status
        ? {
            status: status as
              | "PENDING"
              | "SUCCESS"
              | "FAILED"
              | "REFUNDED",
          }
        : {}),
      ...(provider
        ? {
            provider: {
              equals: provider,
              mode: "insensitive",
            },
          }
        : {}),
      ...(search
        ? {
            OR: [
              {
                reference: {
                  contains: search,
                  mode: "insensitive",
                },
              },
              {
                user: {
                  email: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
              },
              {
                user: {
                  firstName: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
              },
              {
                user: {
                  lastName: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
              },
            ],
          }
        : {}),
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const providers = Array.from(
    new Set(
      (
        await prisma.payment.findMany({
          where: {
            provider: {
              not: null,
            },
          },
          select: {
            provider: true,
          },
          distinct: ["provider"],
          orderBy: {
            provider: "asc",
          },
        })
      )
        .map((payment) => payment.provider)
        .filter(
          (value): value is string => Boolean(value)
        )
    )
  );

  const successfulPayments = payments.filter(
    (payment) => payment.status === "SUCCESS"
  ).length;

  const pendingPayments = payments.filter(
    (payment) => payment.status === "PENDING"
  ).length;

  const failedPayments = payments.filter(
    (payment) => payment.status === "FAILED"
  ).length;

  const refundedPayments = payments.filter(
    (payment) => payment.status === "REFUNDED"
  ).length;

  const totalSuccessfulAmount = payments
    .filter((payment) => payment.status === "SUCCESS")
    .reduce(
      (total, payment) => total + Number(payment.amount),
      0
    );

  function getStatusClasses(paymentStatus: string) {
    switch (paymentStatus) {
      case "SUCCESS":
        return "bg-green-100 text-green-700 border-green-200";

      case "FAILED":
        return "bg-red-100 text-red-700 border-red-200";

      case "REFUNDED":
        return "bg-slate-100 text-slate-700 border-slate-200";

      case "PENDING":
      default:
        return "bg-blue-100 text-blue-700 border-blue-200";
    }
  }

  function getStatusLabel(paymentStatus: string) {
    switch (paymentStatus) {
      case "SUCCESS":
        return "Successful";

      case "FAILED":
        return "Failed";

      case "REFUNDED":
        return "Refunded";

      case "PENDING":
        return "Pending";

      default:
        return paymentStatus;
    }
  }

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
                ← Back to Admin
              </Link>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-900">
                  Payments
                </h1>

                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                  Admin
                </span>
              </div>

              <p className="mt-1 text-sm text-slate-500">
                Monitor student payment transactions and payment status.
              </p>
            </div>
          </div>

          <div className="hidden rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-right sm:block">
            <p className="text-xs font-medium uppercase tracking-wide text-blue-600">
              Payments Found
            </p>

            <p className="mt-1 text-xl font-bold text-blue-900">
              {payments.length}
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Overview */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Total Records
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {payments.length}
                </p>
              </div>

              <div className="rounded-xl bg-blue-100 px-3 py-2 text-blue-700">
                ₵
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-green-200 bg-green-50 p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-green-700">
                  Successful
                </p>

                <p className="mt-2 text-3xl font-bold text-green-800">
                  {successfulPayments}
                </p>
              </div>

              <div className="rounded-xl bg-white px-3 py-2 text-green-700">
                ✓
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-blue-700">
                  Pending
                </p>

                <p className="mt-2 text-3xl font-bold text-blue-800">
                  {pendingPayments}
                </p>
              </div>

              <div className="rounded-xl bg-white px-3 py-2 text-blue-700">
                …
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-red-700">
                  Failed
                </p>

                <p className="mt-2 text-3xl font-bold text-red-800">
                  {failedPayments}
                </p>
              </div>

              <div className="rounded-xl bg-white px-3 py-2 text-red-700">
                !
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Successful Amount
              </p>

              <p className="mt-2 text-2xl font-bold text-slate-900">
                GHS {totalSuccessfulAmount.toFixed(2)}
              </p>

              {refundedPayments > 0 && (
                <p className="mt-1 text-xs text-slate-500">
                  {refundedPayments} refunded record
                  {refundedPayments === 1 ? "" : "s"}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Filters */}
        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-bold text-slate-900">
              Filter Payments
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Search by student or reference and narrow the payment records
              by status or provider.
            </p>
          </div>

          <form
            method="GET"
            className="grid gap-4 md:grid-cols-4"
          >
            <div>
              <label
                htmlFor="search"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Search
              </label>

              <input
                id="search"
                name="search"
                type="text"
                defaultValue={search}
                placeholder="Reference, name or email"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                htmlFor="status"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Status
              </label>

              <select
                id="status"
                name="status"
                defaultValue={status}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">All statuses</option>
                <option value="PENDING">Pending</option>
                <option value="SUCCESS">Success</option>
                <option value="FAILED">Failed</option>
                <option value="REFUNDED">Refunded</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="provider"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Provider
              </label>

              <select
                id="provider"
                name="provider"
                defaultValue={provider}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">All providers</option>

                {providers.map((paymentProvider) => (
                  <option
                    key={paymentProvider}
                    value={paymentProvider}
                  >
                    {paymentProvider}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end gap-2">
              <button
                type="submit"
                className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                Filter
              </button>

              <Link
                href="/admin/payments"
                className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Clear
              </Link>
            </div>
          </form>

          {(search || status || provider) && (
            <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-200 pt-4">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Active filters:
              </span>

              {search && (
                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                  Search: {search}
                </span>
              )}

              {status && (
                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                  Status: {getStatusLabel(status)}
                </span>
              )}

              {provider && (
                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                  Provider: {provider}
                </span>
              )}
            </div>
          )}
        </section>

        {/* Payments Table */}
        <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Payment Records
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Review individual payment transactions and their details.
                </p>
              </div>

              <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                {payments.length} record
                {payments.length === 1 ? "" : "s"}
              </span>
            </div>
          </div>

          {payments.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-xl font-bold text-blue-600">
                ₵
              </div>

              <h2 className="mt-4 text-lg font-semibold text-slate-900">
                No payments found
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                No payment records match the current search or filters.
                Try changing your search criteria.
              </p>

              <Link
                href="/admin/payments"
                className="mt-5 inline-flex rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                View All Payments
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Student
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Reference
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Amount
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Status
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Provider
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Paid At
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Created
                    </th>

                    <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200">
                  {payments.map((payment) => {
                    const initials =
                      `${payment.user.firstName.charAt(0)}${payment.user.lastName.charAt(0)}`.toUpperCase();

                    return (
                      <tr
                        key={payment.id}
                        className="transition hover:bg-blue-50/40"
                      >
                        <td className="whitespace-nowrap px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                              {initials}
                            </div>

                            <div>
                              <div className="font-semibold text-slate-900">
                                {payment.user.firstName}{" "}
                                {payment.user.lastName}
                              </div>

                              <div className="mt-1 text-xs text-slate-500">
                                {payment.user.email}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="whitespace-nowrap px-5 py-4">
                          <span className="font-mono text-sm font-medium text-slate-700">
                            {payment.reference}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-5 py-4">
                          <span className="text-sm font-bold text-slate-900">
                            {payment.currency}{" "}
                            {Number(payment.amount).toFixed(2)}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClasses(
                              payment.status
                            )}`}
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-current" />
                            {getStatusLabel(payment.status)}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-5 py-4">
                          {payment.provider ? (
                            <span className="inline-flex rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-700">
                              {payment.provider}
                            </span>
                          ) : (
                            <span className="text-sm text-slate-400">
                              —
                            </span>
                          )}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                          {payment.paidAt
                            ? payment.paidAt.toLocaleString()
                            : "—"}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                          {payment.createdAt.toLocaleString()}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-right">
                          <Link
                            href={`/admin/payments/${payment.id}`}
                            className="inline-flex rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Status Legend */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900">
            Payment Status Guide
          </h2>

          <div className="mt-4 flex flex-wrap gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              Successful
            </span>

            <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
              <span className="h-2 w-2 rounded-full bg-blue-500" />
              Pending
            </span>

            <span className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              Failed
            </span>

            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700">
              <span className="h-2 w-2 rounded-full bg-slate-500" />
              Refunded
            </span>
          </div>
        </section>

        {/* Navigation */}
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/admin"
            className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Admin Dashboard
          </Link>

          <Link
            href="/admin/subscriptions"
            className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Subscriptions
          </Link>

          <Link
            href="/admin/payment-health"
            className="rounded-xl border border-green-200 bg-green-50 px-5 py-3 text-sm font-semibold text-green-700 transition hover:bg-green-100"
          >
            Payment Health
          </Link>
        </div>
      </div>
    </main>
  );
}