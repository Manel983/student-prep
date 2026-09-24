import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import SubjectCard from "./SubjectCard";

export default async function DashboardPage() {
  const session = await auth();

  // Protect the dashboard
  if (!session?.user?.id) {
    redirect("/login");
  }

  // Get the logged-in student and related information
  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
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
      },
      results: {
        include: {
          exam: {
            include: {
              subject: true,
            },
          },
        },
        orderBy: {
          completedAt: "desc",
        },
        take: 5,
      },
    },
  });

  if (!user) {
    redirect("/login");
  }

  // Get all active subjects from the database
  const subjects = await prisma.subject.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  /*
   * ---------------------------------------------------------
   * SUBSCRIPTION STATUS
   * ---------------------------------------------------------
   */

  const now = new Date();

  // Mark expired paid subscriptions as EXPIRED.
  const expiredPaidSubscriptions = user.subscriptions.filter(
    (sub) =>
      sub.plan.type !== "FREE" &&
      sub.status === "ACTIVE" &&
      sub.expiresAt &&
      sub.expiresAt <= now
  );

  if (expiredPaidSubscriptions.length > 0) {
    await prisma.subscription.updateMany({
      where: {
        id: {
          in: expiredPaidSubscriptions.map((sub) => sub.id),
        },
        status: "ACTIVE",
      },
      data: {
        status: "EXPIRED",
      },
    });

    for (const sub of expiredPaidSubscriptions) {
      sub.status = "EXPIRED";
    }
  }

  const activePaidSubscription = user.subscriptions.find(
    (sub) =>
      sub.plan.type !== "FREE" &&
      sub.status === "ACTIVE" &&
      (!sub.expiresAt || sub.expiresAt > now)
  );

  // Find an active Free subscription with remaining tests
  const activeFreeSubscription = user.subscriptions.find(
    (sub) =>
      sub.plan.type === "FREE" &&
      sub.status === "ACTIVE" &&
      sub.plan.testsAllowed !== null &&
      sub.testsUsed < sub.plan.testsAllowed
  );

  // Paid subscription takes priority.
  // If there is no active paid subscription, use Free if available.
  const subscription =
    activePaidSubscription ?? activeFreeSubscription;

  const plan = subscription?.plan;

  /*
   * Determine whether the student has any usable subscription.
   */
  const hasActivePlan = Boolean(subscription);

  /*
   * Determine whether the currently selected plan is Free.
   */
  const isFreePlan = plan?.type === "FREE";

  /*
   * Calculate remaining Free tests.
   */
  const freeTestsRemaining =
    isFreePlan &&
    plan?.testsAllowed !== null &&
    plan?.testsAllowed !== undefined
      ? Math.max(
          plan.testsAllowed - (subscription?.testsUsed ?? 0),
          0
        )
      : null;

  const firstName = user.firstName;

  const classLabels: Record<string, string> = {
    PRIMARY_1: "Primary 1",
    PRIMARY_2: "Primary 2",
    PRIMARY_3: "Primary 3",
    PRIMARY_4: "Primary 4",
    PRIMARY_5: "Primary 5",
    PRIMARY_6: "Primary 6",
    JHS_1: "JHS 1",
    JHS_2: "JHS 2",
    JHS_3: "JHS 3",
  };

  const studentClass = user.profile?.classLevel
    ? classLabels[user.profile.classLevel] ?? user.profile.classLevel
    : "Class not set";

  const totalTests = user.results.length;

  const averageScore =
    totalTests > 0
      ? Math.round(
          user.results.reduce(
            (total, result) =>
              total + Number(result.percentage),
            0
          ) / totalTests
        )
      : 0;

  const subjectDetails: Record<
    string,
    {
      icon: string;
      description: string;
    }
  > = {
    Mathematics: {
      icon: "📐",
      description:
        "Numbers, algebra, geometry and problem solving.",
    },
    "English Language": {
      icon: "📖",
      description:
        "Grammar, vocabulary, comprehension and writing.",
    },
    Science: {
      icon: "🔬",
      description:
        "Explore scientific concepts and everyday phenomena.",
    },
    "Social Studies": {
      icon: "🌍",
      description:
        "Society, culture, government, geography and history.",
    },
    Computing: {
      icon: "💻",
      description:
        "Computer fundamentals, programming and technology.",
    },
  };

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href="/dashboard"
            className="flex items-center gap-3"
          >
            <img
              src="/logo.jpg"
              alt="Student Prep"
              className="h-11 w-auto object-contain"
            />

            <div>
              <h1 className="text-lg font-bold text-slate-900">
                Student Prep
              </h1>

              <p className="text-xs text-slate-500">
                Test your knowledge
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-3 sm:gap-4">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-slate-900">
                {user.firstName} {user.lastName}
              </p>

              <p className="text-xs text-slate-500">
                {user.email}
              </p>

              <p className="mt-1 text-xs font-semibold text-blue-600">
                {studentClass}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700 ring-2 ring-blue-50">
              {user.firstName.charAt(0)}
              {user.lastName.charAt(0)}
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Welcome */}
        <section className="mb-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-green-500" />

                <p className="text-sm font-semibold text-green-700">
                  Student Dashboard
                </p>
              </div>

              <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                Welcome back, {firstName}! 👋
              </h1>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <p className="text-slate-600">
                  Keep learning, keep practising, and keep improving.
                </p>

                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  {studentClass}
                </span>
              </div>
            </div>

            <LogoutButton />
          </div>
        </section>

        {/* Statistics */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Current Plan */}
          <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Current Plan
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {plan?.name ?? "No Active Plan"}
                </p>
              </div>

              <span
                className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                  hasActivePlan
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {hasActivePlan ? "✓" : "!"}
              </span>
            </div>

            <p
              className={`mt-2 text-xs font-bold ${
                hasActivePlan
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {hasActivePlan
                ? subscription?.status
                : "Subscription expired"}
            </p>

            {isFreePlan && freeTestsRemaining !== null && (
              <div className="mt-3 rounded-lg bg-blue-50 px-3 py-2">
                <p className="text-xs font-medium text-blue-700">
                  {freeTestsRemaining} free test
                  {freeTestsRemaining === 1 ? "" : "s"} remaining
                </p>
              </div>
            )}

            <Link
              href="/subscription"
              className="mt-4 inline-flex items-center rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
            >
              Manage Subscription
            </Link>
          </div>

          {/* Tests Completed */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Tests Completed
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {totalTests}
                </p>
              </div>

              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-lg">
                📝
              </span>
            </div>

            <p className="mt-2 text-xs text-slate-500">
              Keep practising!
            </p>
          </div>

          {/* Average Score */}
          <div className="rounded-2xl border border-green-100 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Average Score
                </p>

                <p className="mt-2 text-3xl font-bold text-green-600">
                  {averageScore}%
                </p>
              </div>

              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-100 text-green-700">
                ✓
              </span>
            </div>

            <p className="mt-2 text-xs text-slate-500">
              Based on recent tests
            </p>
          </div>

          {/* Questions Available */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Questions Available
                </p>

                <p className="mt-2 text-2xl font-bold text-blue-600">
                  {plan?.unlimitedQuestions
                    ? "Unlimited"
                    : plan?.questionsPerSubject ?? 0}
                </p>
              </div>

              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-lg">
                📚
              </span>
            </div>

            <p className="mt-2 text-xs text-slate-500">
              Per subject
            </p>
          </div>
        </section>

        {/* No active subscription warning */}
        {!hasActivePlan && (
          <section className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-600 font-bold text-white">
                  !
                </span>

                <div>
                  <h3 className="font-bold text-red-800">
                    Your subscription has expired
                  </h3>

                  <p className="mt-1 text-sm text-red-700">
                    Renew your subscription to continue taking
                    tests.
                  </p>
                </div>
              </div>

              <Link
                href="/subscription"
                className="inline-flex items-center justify-center rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
              >
                Renew Subscription
              </Link>
            </div>
          </section>
        )}

        {/* Main content */}
        <section className="mt-8 grid gap-8 lg:grid-cols-3">
          {/* Subjects */}
          <div
            id="subjects"
            className="lg:col-span-2"
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  Subjects
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Choose a subject to start practising.
                </p>
              </div>

              <span className="hidden rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 sm:inline-block">
                {subjects.length} available
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {subjects.map((subject) => {
                const details =
                  subjectDetails[subject.name] ?? {
                    icon: "📚",
                    description:
                      "Practice questions and improve your knowledge.",
                  };

                return (
                  <SubjectCard
                    key={subject.id}
                    subjectId={subject.id}
                    name={subject.name}
                    icon={details.icon}
                    description={details.description}
                  />
                );
              })}
            </div>
          </div>

          {/* Quick actions */}
          <div>
            <h3 className="text-xl font-bold text-slate-900">
              Quick Actions
            </h3>

            <div className="mt-4 space-y-4">
              <Link
                href="#subjects"
                className="group block w-full rounded-2xl bg-blue-600 p-5 text-left text-white shadow-sm transition hover:bg-blue-700 hover:shadow-md"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 text-2xl">
                  📝
                </div>

                <h4 className="mt-4 font-bold">
                  Start a Test
                </h4>

                <p className="mt-1 text-sm text-blue-100">
                  Test yourself on any available subject.
                </p>

                <span className="mt-4 inline-block text-sm font-semibold text-white">
                  Choose a subject →
                </span>
              </Link>

              <Link
                href="#recent-results"
                className="group block w-full rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-blue-200 hover:shadow-md"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-2xl">
                  📊
                </div>

                <h4 className="mt-4 font-bold text-slate-900">
                  View Results
                </h4>

                <p className="mt-1 text-sm text-slate-500">
                  Review your previous test performance.
                </p>

                <span className="mt-4 inline-block text-sm font-semibold text-blue-600">
                  View results →
                </span>
              </Link>

              <Link
                href="#recent-results"
                className="group block w-full rounded-2xl border border-green-100 bg-white p-5 text-left shadow-sm transition hover:border-green-200 hover:shadow-md"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 text-2xl">
                  🧠
                </div>

                <h4 className="mt-4 font-bold text-slate-900">
                  Review Mistakes
                </h4>

                <p className="mt-1 text-sm text-slate-500">
                  Learn from questions you answered incorrectly.
                </p>

                <span className="mt-4 inline-block text-sm font-semibold text-green-600">
                  Review mistakes →
                </span>
              </Link>
            </div>
          </div>
        </section>

        {/* Recent results */}
        <section
          id="recent-results"
          className="mt-10"
        >
          <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="text-xl font-bold text-slate-900">
                Recent Results
              </h3>

              <p className="text-sm text-slate-500">
                Your latest completed tests.
              </p>
            </div>

            {user.results.length > 0 && (
              <span className="text-xs font-medium text-slate-500">
                Showing your latest {user.results.length}
              </span>
            )}
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {user.results.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-3xl">
                  📚
                </div>

                <h4 className="mt-5 font-bold text-slate-900">
                  No tests completed yet
                </h4>

                <p className="mt-2 text-sm text-slate-500">
                  Choose a subject above and take your first test.
                </p>

                <Link
                  href="#subjects"
                  className="mt-5 inline-flex rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  Start Your First Test
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {user.results.map((result) => {
                  const percentage = Number(result.percentage);

                  const scoreClass =
                    percentage >= 80
                      ? "bg-green-50 text-green-700 ring-green-200"
                      : percentage >= 40
                        ? "bg-blue-50 text-blue-700 ring-blue-200"
                        : "bg-red-50 text-red-700 ring-red-200";

                  return (
                    <div
                      key={result.id}
                      className="flex flex-col gap-4 px-6 py-5 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold text-blue-700">
                          {result.exam.subject.name
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div>
                          <h4 className="font-semibold text-slate-900">
                            {result.exam.subject.name}
                          </h4>

                          <p className="mt-1 text-sm text-slate-500">
                            {result.exam.title}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-5 sm:justify-end">
                        <div className="text-right">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-sm font-bold ring-1 ${scoreClass}`}
                          >
                            {percentage}%
                          </span>

                          <p className="mt-1 text-xs text-slate-500">
                            {result.correctAnswers} correct
                          </p>
                        </div>

                        <Link
                          href={`/results/${result.id}`}
                          className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
                        >
                          Review
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-12 border-t border-slate-200 pt-6 text-center text-sm text-slate-500">
          Student Prep —{" "}
          <span className="font-medium text-blue-600">
            Learn.
          </span>{" "}
          <span className="font-medium text-green-600">
            Practice.
          </span>{" "}
          <span className="font-medium text-red-600">
            Improve.
          </span>
        </footer>
      </div>
    </main>
  );
}