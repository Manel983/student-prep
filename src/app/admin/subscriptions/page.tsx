import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

interface AdminSubscriptionsPageProps {
  searchParams: Promise<{
    search?: string;
    planType?: string;
    status?: string;
  }>;
}

function formatDate(date: Date | null | undefined) {
  if (!date) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-GH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function statusLabel(status: string) {
  switch (status) {
    case "ACTIVE":
      return "Active";

    case "EXPIRED":
      return "Expired";

    case "CANCELLED":
      return "Cancelled";

    case "PENDING":
      return "Pending";

    default:
      return status;
  }
}

function statusClasses(status: string) {
  switch (status) {
    case "ACTIVE":
      return "bg-green-100 text-green-700 ring-1 ring-green-200";

    case "EXPIRED":
      return "bg-red-100 text-red-700 ring-1 ring-red-200";

    case "CANCELLED":
      return "bg-red-100 text-red-700 ring-1 ring-red-200";

    case "PENDING":
      return "bg-blue-100 text-blue-700 ring-1 ring-blue-200";

    default:
      return "bg-slate-100 text-slate-600 ring-1 ring-slate-200";
  }
}

function planLabel(type: string) {
  switch (type) {
    case "FREE":
      return "Free";

    case "MONTHLY":
      return "Monthly";

    case "SIX_MONTHS":
      return "6 Months";

    case "YEARLY":
      return "1 Year";

    default:
      return type;
  }
}

export default async function AdminSubscriptionsPage({
  searchParams,
}: AdminSubscriptionsPageProps) {
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
  const planType = params.planType || "";
  const status = params.status || "";

  const validPlanTypes = [
    "FREE",
    "MONTHLY",
    "SIX_MONTHS",
    "YEARLY",
  ];

  const validStatuses = [
    "ACTIVE",
    "EXPIRED",
    "CANCELLED",
    "PENDING",
  ];

  const subscriptions = await prisma.subscription.findMany({
    where: {
      ...(search
        ? {
            user: {
              OR: [
                {
                  email: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
                {
                  firstName: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
                {
                  lastName: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
              ],
            },
          }
        : {}),

      ...(planType && validPlanTypes.includes(planType)
        ? {
            plan: {
              type: planType as
                | "FREE"
                | "MONTHLY"
                | "SIX_MONTHS"
                | "YEARLY",
            },
          }
        : {}),

      ...(status && validStatuses.includes(status)
        ? {
            status: status as
              | "ACTIVE"
              | "EXPIRED"
              | "CANCELLED"
              | "PENDING",
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

      plan: {
        select: {
          id: true,
          name: true,
          type: true,
          price: true,
        },
      },
    },

    orderBy: {
      createdAt: "desc",
    },
  });

  const activeCount = subscriptions.filter(
    (subscription) => subscription.status === "ACTIVE"
  ).length;

  const expiredCount = subscriptions.filter(
    (subscription) => subscription.status === "EXPIRED"
  ).length;

  const pendingCount = subscriptions.filter(
    (subscription) => subscription.status === "PENDING"
  ).length;

  const paidCount = subscriptions.filter(
    (subscription) => subscription.plan.type !== "FREE"
  ).length;

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex items-center gap-4">
            <img
              src="/logo.jpg"
              alt="Student Prep"
              className="h-11 w-auto object-contain"
            />

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900">
                  Subscriptions
                </h1>

                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                  Admin
                </span>
              </div>

              <p className="mt-1 text-sm text-slate-500">
                Monitor student subscription plans, usage, and status.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/payments"
              className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Payments
            </Link>

            <Link
              href="/admin"
              className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Admin Dashboard
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Overview */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Subscriptions
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {subscriptions.length}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Matching current filters
            </p>
          </div>

          <div className="rounded-2xl border border-green-200 bg-green-50 p-5 shadow-sm">
            <p className="text-sm font-medium text-green-700">
              Active
            </p>

            <p className="mt-2 text-3xl font-bold text-green-700">
              {activeCount}
            </p>

            <p className="mt-1 text-xs text-green-600">
              Currently active subscriptions
            </p>
          </div>

          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
            <p className="text-sm font-medium text-blue-700">
              Paid Plans
            </p>

            <p className="mt-2 text-3xl font-bold text-blue-700">
              {paidCount}
            </p>

            <p className="mt-1 text-xs text-blue-600">
              Monthly, 6-month, and yearly plans
            </p>
          </div>

          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm">
            <p className="text-sm font-medium text-red-700">
              Attention
            </p>

            <p className="mt-2 text-3xl font-bold text-red-700">
              {expiredCount + pendingCount}
            </p>

            <p className="mt-1 text-xs text-red-600">
              Expired or pending subscriptions
            </p>
          </div>
        </section>

        {/* Filters */}
        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-bold text-slate-900">
              Filter Subscriptions
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Search students and narrow subscriptions by plan or status.
            </p>
          </div>

          <form
            method="GET"
            className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
          >
            <div className="lg:col-span-2">
              <label
                htmlFor="search"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Search
              </label>

              <input
                id="search"
                type="search"
                name="search"
                defaultValue={search}
                placeholder="Search student name or email..."
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                htmlFor="planType"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Plan
              </label>

              <select
                id="planType"
                name="planType"
                defaultValue={planType}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">All Plans</option>
                <option value="FREE">Free</option>
                <option value="MONTHLY">Monthly</option>
                <option value="SIX_MONTHS">6 Months</option>
                <option value="YEARLY">1 Year</option>
              </select>
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
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="EXPIRED">Expired</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="PENDING">Pending</option>
              </select>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row md:col-span-2 lg:col-span-4">
              <button
                type="submit"
                className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Apply Filters
              </button>

              {(search || planType || status) && (
                <Link
                  href="/admin/subscriptions"
                  className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Clear Filters
                </Link>
              )}
            </div>
          </form>
        </section>

        {/* Count and active filters */}
        <div className="mt-8 mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-600">
            Showing{" "}
            <span className="font-semibold text-slate-900">
              {subscriptions.length}
            </span>{" "}
            {subscriptions.length === 1
              ? "subscription"
              : "subscriptions"}
            .
          </p>

          {(search || planType || status) && (
            <div className="flex flex-wrap gap-2 text-xs">
              {search && (
                <span className="rounded-full bg-blue-100 px-3 py-1.5 font-medium text-blue-700">
                  Search: {search}
                </span>
              )}

              {planType && (
                <span className="rounded-full bg-blue-100 px-3 py-1.5 font-medium text-blue-700">
                  Plan: {planLabel(planType)}
                </span>
              )}

              {status && (
                <span className="rounded-full bg-green-100 px-3 py-1.5 font-medium text-green-700">
                  Status: {statusLabel(status)}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Subscription Table */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
            <h2 className="font-bold text-slate-900">
              Subscription Records
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Detailed student subscription and usage information.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="border-b border-slate-200 bg-white">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Student
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Plan
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Status
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Start
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Expiry
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Tests Used
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Free Tests
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Payment
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Created
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {subscriptions.map((subscription) => (
                  <tr
                    key={subscription.id}
                    className="transition hover:bg-slate-50"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                          {subscription.user.firstName
                            .charAt(0)
                            .toUpperCase()}
                          {subscription.user.lastName
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div>
                          <p className="whitespace-nowrap font-semibold text-slate-900">
                            {subscription.user.firstName}{" "}
                            {subscription.user.lastName}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {subscription.user.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="whitespace-nowrap px-6 py-4">
                      <p className="font-semibold text-slate-900">
                        {subscription.plan.name}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {planLabel(subscription.plan.type)} · GHS{" "}
                        {Number(subscription.plan.price).toFixed(2)}
                      </p>
                    </td>

                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold ${statusClasses(
                          subscription.status
                        )}`}
                      >
                        {statusLabel(subscription.status)}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                      {formatDate(subscription.startedAt)}
                    </td>

                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                      {formatDate(subscription.expiresAt)}
                    </td>

                    <td className="whitespace-nowrap px-6 py-4">
                      <span className="font-semibold text-slate-900">
                        {subscription.testsUsed}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-6 py-4">
                      <span className="font-semibold text-slate-900">
                        {subscription.freeTestsUsed}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-6 py-4">
                      {subscription.paymentRequired ? (
                        <span className="inline-flex rounded-full bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-700">
                          Required
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-green-100 px-3 py-1.5 text-xs font-semibold text-green-700">
                          Not Required
                        </span>
                      )}
                    </td>

                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                      {formatDate(subscription.createdAt)}
                    </td>

                    <td className="whitespace-nowrap px-6 py-4">
                      <Link
                        href={`/admin/subscriptions/${subscription.id}`}
                        className="inline-flex rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}

                {subscriptions.length === 0 && (
                  <tr>
                    <td
                      colSpan={10}
                      className="px-6 py-16 text-center"
                    >
                      <div className="mx-auto max-w-md">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-500">
                          —
                        </div>

                        <h3 className="mt-4 text-lg font-bold text-slate-900">
                          No subscriptions found
                        </h3>

                        <p className="mt-2 text-sm text-slate-500">
                          No subscription records match the selected
                          filters. Try changing your search, plan, or
                          status.
                        </p>

                        <Link
                          href="/admin/subscriptions"
                          className="mt-5 inline-flex rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                        >
                          Clear Filters
                        </Link>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Status Legend */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center gap-5 text-sm">
            <span className="font-semibold text-slate-700">
              Status:
            </span>

            <span className="flex items-center gap-2 text-green-700">
              <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
              Active
            </span>

            <span className="flex items-center gap-2 text-blue-700">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
              Pending
            </span>

            <span className="flex items-center gap-2 text-red-700">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
              Expired / Cancelled
            </span>
          </div>
        </section>

        {/* Navigation */}
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/admin"
            className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Admin Dashboard
          </Link>

          <Link
            href="/admin/payments"
            className="rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Manage Payments
          </Link>

          <Link
            href="/admin/students"
            className="rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Students
          </Link>
        </div>
      </div>
    </main>
  );
}