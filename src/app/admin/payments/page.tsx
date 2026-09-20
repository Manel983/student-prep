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

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
          <div>
            <Link
              href="/admin"
              className="text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              ← Back to Admin
            </Link>

            <h1 className="mt-3 text-2xl font-bold text-slate-900">
              Payments
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              View and monitor student payment records.
            </p>
          </div>

          <div className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">
            {payments.length} payment
            {payments.length === 1 ? "" : "s"}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Filters */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <form
            method="GET"
            className="grid gap-4 md:grid-cols-4"
          >
            <div>
              <label
                htmlFor="search"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Search
              </label>

              <input
                id="search"
                name="search"
                type="text"
                defaultValue={search}
                placeholder="Reference, name or email"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                htmlFor="status"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Status
              </label>

              <select
                id="status"
                name="status"
                defaultValue={status}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Provider
              </label>

              <select
                id="provider"
                name="provider"
                defaultValue={provider}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
                className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Filter
              </button>

              <Link
                href="/admin/payments"
                className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Clear
              </Link>
            </div>
          </form>
        </section>

        {/* Payments Table */}
        <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {payments.length === 0 ? (
            <div className="p-10 text-center">
              <h2 className="text-lg font-semibold text-slate-900">
                No payments found
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Try changing your search or filters.
              </p>
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
                  {payments.map((payment) => (
                    <tr
                      key={payment.id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="whitespace-nowrap px-5 py-4">
                        <div className="font-medium text-slate-900">
                          {payment.user.firstName}{" "}
                          {payment.user.lastName}
                        </div>

                        <div className="mt-1 text-xs text-slate-500">
                          {payment.user.email}
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-sm font-medium text-slate-700">
                        {payment.reference}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-slate-900">
                        {payment.currency}{" "}
                        {Number(payment.amount).toFixed(2)}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
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
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                        {payment.provider || "—"}
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
                          className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}