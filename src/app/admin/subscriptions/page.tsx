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
      return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";

    case "EXPIRED":
      return "bg-amber-50 text-amber-700 ring-1 ring-amber-200";

    case "CANCELLED":
      return "bg-red-50 text-red-700 ring-1 ring-red-200";

    case "PENDING":
      return "bg-blue-50 text-blue-700 ring-1 ring-blue-200";

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

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Subscriptions
            </h1>

            <p className="mt-2 text-slate-600">
              View and monitor student subscription activity.
            </p>
          </div>

          <Link
            href="/admin"
            className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            ← Admin Dashboard
          </Link>
        </div>

        {/* Filters */}
        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Filter Subscriptions
          </h2>

          <form
            method="GET"
            className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-4"
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
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">All Plans</option>
                <option value="FREE">Free</option>
                <option value="MONTHLY">Monthly</option>
                <option value="SIX_MONTHS">
                  6 Months
                </option>
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
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="EXPIRED">Expired</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="PENDING">Pending</option>
              </select>
            </div>

            <div className="flex flex-col gap-3 md:col-span-2 lg:col-span-4 sm:flex-row">
              <button
                type="submit"
                className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Apply Filters
              </button>

              {(search || planType || status) && (
                <Link
                  href="/admin/subscriptions"
                  className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Clear Filters
                </Link>
              )}
            </div>
          </form>
        </section>

        {/* Count */}
        <div className="mb-4">
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
        </div>

        {/* Subscription Table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    Student
                  </th>

                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    Plan
                  </th>

                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    Status
                  </th>

                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    Start Date
                  </th>

                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    Expiry Date
                  </th>

                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    Tests Used
                  </th>

                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    Free Tests
                  </th>

                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    Payment
                  </th>

                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    Created
                  </th>

                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {subscriptions.map((subscription) => (
                  <tr
                    key={subscription.id}
                    className="hover:bg-slate-50"
                  >
                    <td className="px-6 py-4">
                      <p className="whitespace-nowrap font-medium text-slate-900">
                        {subscription.user.firstName}{" "}
                        {subscription.user.lastName}
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        {subscription.user.email}
                      </p>
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
                        className={`rounded-full px-3 py-1 text-xs font-medium ${statusClasses(
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
                      <span
                        className={
                          subscription.paymentRequired
                            ? "font-semibold text-amber-600"
                            : "font-semibold text-emerald-600"
                        }
                      >
                        {subscription.paymentRequired
                          ? "Required"
                          : "Not Required"}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                      {formatDate(subscription.createdAt)}
                    </td>

                    <td className="whitespace-nowrap px-6 py-4">
                      <Link
                        href={`/admin/subscriptions/${subscription.id}`}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
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
                      className="px-6 py-12 text-center text-sm text-slate-500"
                    >
                      No subscriptions found matching the
                      selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}