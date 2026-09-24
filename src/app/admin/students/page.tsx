import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

interface AdminStudentsPageProps {
  searchParams: Promise<{
    search?: string;
  }>;
}

export default async function AdminStudentsPage({
  searchParams,
}: AdminStudentsPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const search = params.search?.trim() || "";

  const students = await prisma.user.findMany({
    where: {
      role: "STUDENT",
      ...(search
        ? {
            OR: [
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
              {
                email: {
                  contains: search,
                  mode: "insensitive",
                },
              },
            ],
          }
        : {}),
    },
    include: {
      profile: true,
      subscriptions: {
        include: {
          plan: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <img
                  src="/logo.jpg"
                  alt="Student Prep"
                  className="h-11 w-auto object-contain"
                />

                <div>
                  <p className="text-sm font-bold text-blue-600">
                    Student Prep Administration
                  </p>

                  <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                    Students
                  </h1>
                </div>
              </div>

              <p className="mt-3 text-sm text-slate-500">
                View registered students and their account information.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-2 text-xs font-semibold text-green-700">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                Admin access active
              </span>

              <Link
                href="/admin"
                className="inline-flex items-center rounded-lg border border-blue-200 bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
              >
                ← Admin Dashboard
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Page Summary */}
        <section className="mb-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-blue-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-lg">
                  👥
                </div>

                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Students Found
                  </p>

                  <p className="text-2xl font-bold text-slate-900">
                    {students.length.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-green-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 text-lg">
                  ✓
                </div>

                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Active Accounts
                  </p>

                  <p className="text-2xl font-bold text-slate-900">
                    {students
                      .filter((student) => student.isActive)
                      .length.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-red-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-lg">
                  !
                </div>

                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Inactive Accounts
                  </p>

                  <p className="text-2xl font-bold text-slate-900">
                    {students
                      .filter((student) => !student.isActive)
                      .length.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Search */}
        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-slate-900">
              Find a Student
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Search by first name, last name, or email address.
            </p>
          </div>

          <form
            method="GET"
            className="flex flex-col gap-3 sm:flex-row"
          >
            <div className="relative flex-1">
              <input
                type="search"
                name="search"
                defaultValue={search}
                placeholder="Search by name or email..."
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <button
              type="submit"
              className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100"
            >
              Search Students
            </button>

            {search && (
              <Link
                href="/admin/students"
                className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Clear
              </Link>
            )}
          </form>

          {search && (
            <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
              <p className="text-sm text-blue-800">
                Showing results for{" "}
                <span className="font-bold">
                  "{search}"
                </span>
                {" — "}
                {students.length}{" "}
                {students.length === 1
                  ? "student"
                  : "students"}{" "}
                found.
              </p>
            </div>
          )}
        </section>

        {/* Student Table */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Registered Students
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Student accounts, profiles, subscriptions, and account
                  status.
                </p>
              </div>

              <span className="inline-flex w-fit rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                {students.length}{" "}
                {students.length === 1
                  ? "student"
                  : "students"}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    Student
                  </th>

                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    Email
                  </th>

                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    School
                  </th>

                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    Class
                  </th>

                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    Plan
                  </th>

                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    Status
                  </th>

                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    Joined
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {students.map((student) => {
                  const subscription = student.subscriptions[0];

                  return (
                    <tr
                      key={student.id}
                      className="transition hover:bg-blue-50/40"
                    >
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
                            {student.firstName
                              .charAt(0)
                              .toUpperCase()}
                            {student.lastName
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div>
                            <p className="font-semibold text-slate-900">
                              {student.firstName}{" "}
                              {student.lastName}
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                              Student account
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                        {student.email}
                      </td>

                      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                        {student.profile?.school || "—"}
                      </td>

                      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                        {student.profile?.classLevel || "—"}
                      </td>

                      <td className="whitespace-nowrap px-6 py-4">
                        {subscription?.plan.name ? (
                          <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                            {subscription.plan.name}
                          </span>
                        ) : (
                          <span className="text-sm text-slate-400">
                            —
                          </span>
                        )}
                      </td>

                      <td className="whitespace-nowrap px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                            student.isActive
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              student.isActive
                                ? "bg-green-600"
                                : "bg-red-600"
                            }`}
                          />

                          {student.isActive
                            ? "Active"
                            : "Inactive"}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                        {student.createdAt.toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}

                {students.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-16 text-center"
                    >
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-2xl">
                        👥
                      </div>

                      <h3 className="mt-4 font-semibold text-slate-900">
                        {search
                          ? "No students found"
                          : "No students yet"}
                      </h3>

                      <p className="mt-2 text-sm text-slate-500">
                        {search
                          ? `No students match "${search}". Try a different search.`
                          : "No student accounts have been registered yet."}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Back to Dashboard */}
        <div className="mt-6">
          <Link
            href="/admin"
            className="inline-flex items-center rounded-lg border border-blue-200 bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
          >
            ← Back to Admin Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}