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
   *
   * A paid subscription is only considered active when:
   * - status is ACTIVE
   * - it has not expired
   *
   * If the paid subscription has expired, we check whether
   * the student still has an available Free subscription.
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
      ? Math.max(plan.testsAllowed - (subscription?.testsUsed ?? 0), 0)
      : null;

  const firstName = user.firstName;

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
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 font-bold text-white">
              SP
            </div>

            <div>
              <h1 className="text-lg font-bold text-slate-900">
                Student Prep
              </h1>

              <p className="text-xs text-slate-500">
                Test your knowledge
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-slate-900">
                {user.firstName} {user.lastName}
              </p>

              <p className="text-xs text-slate-500">
                {user.email}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
              {user.firstName.charAt(0)}
              {user.lastName.charAt(0)}
            </div>
          </div>
        </div>
      </header>

      {/* Dashboard */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Welcome */}
        <section className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Student Dashboard
              </h1>

              <p className="mt-1 text-sm text-slate-600">
                Welcome back to your Student Prep dashboard.
              </p>
            </div>

            <LogoutButton />
          </div>

          <h2 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            Welcome back, {firstName}! 👋
          </h2>

          <p className="mt-2 text-slate-600">
            Keep learning, keep practicing, and keep improving.
          </p>
        </section>

        {/* Statistics */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Current Plan */}
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">
              Current Plan
            </p>

            <p className="mt-2 text-2xl font-bold text-slate-900">
              {plan?.name ?? "No Active Plan"}
            </p>

            <p
              className={`mt-1 text-xs font-medium ${
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
              <p className="mt-1 text-xs text-slate-500">
                {freeTestsRemaining} free test
                {freeTestsRemaining === 1 ? "" : "s"} remaining
              </p>
            )}

            <Link
              href="/subscription"
              className="mt-4 inline-block rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
            >
              Manage Subscription
            </Link>
          </div>

          {/* Tests Completed */}
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">
              Tests Completed
            </p>

            <p className="mt-2 text-2xl font-bold text-slate-900">
              {totalTests}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Keep practicing!
            </p>
          </div>

          {/* Average Score */}
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">
              Average Score
            </p>

            <p className="mt-2 text-2xl font-bold text-slate-900">
              {averageScore}%
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Based on recent tests
            </p>
          </div>

          {/* Questions Available */}
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">
              Questions Available
            </p>

            <p className="mt-2 text-2xl font-bold text-slate-900">
              {plan?.unlimitedQuestions
                ? "Unlimited"
                : plan?.questionsPerSubject ?? 0}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Per subject
            </p>
          </div>
        </section>

        {/* No active subscription warning */}
        {!hasActivePlan && (
          <section className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-bold text-red-800">
                  Your subscription has expired
                </h3>

                <p className="mt-1 text-sm text-red-700">
                  Renew your subscription to continue taking
                  tests.
                </p>
              </div>

              <Link
                href="/subscription"
                className="inline-block rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
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

                <p className="text-sm text-slate-500">
                  Choose a subject to start practicing.
                </p>
              </div>
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
                className="block w-full rounded-2xl bg-blue-600 p-5 text-left text-white shadow-sm transition hover:bg-blue-700"
              >
                <div className="text-2xl">📝</div>

                <h4 className="mt-3 font-bold">
                  Start a Test
                </h4>

                <p className="mt-1 text-sm text-blue-100">
                  Test yourself on any available subject.
                </p>
              </Link>

              <Link
                href="#recent-results"
                className="block w-full rounded-2xl bg-white p-5 text-left shadow-sm ring-1 ring-slate-200 transition hover:shadow-md"
              >
                <div className="text-2xl">📊</div>

                <h4 className="mt-3 font-bold text-slate-900">
                  View Results
                </h4>

                <p className="mt-1 text-sm text-slate-500">
                  Review your previous test performance.
                </p>
              </Link>

              <Link
                href="#recent-results"
                className="block w-full rounded-2xl bg-white p-5 text-left shadow-sm ring-1 ring-slate-200 transition hover:shadow-md"
              >
                <div className="text-2xl">🧠</div>

                <h4 className="mt-3 font-bold text-slate-900">
                  Review Mistakes
                </h4>

                <p className="mt-1 text-sm text-slate-500">
                  Learn from questions you answered incorrectly.
                </p>
              </Link>
            </div>
          </div>
        </section>

        {/* Recent results */}
        <section
          id="recent-results"
          className="mt-10"
        >
          <div className="mb-4">
            <h3 className="text-xl font-bold text-slate-900">
              Recent Results
            </h3>

            <p className="text-sm text-slate-500">
              Your latest completed tests.
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
            {user.results.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <div className="text-4xl">📚</div>

                <h4 className="mt-4 font-bold text-slate-900">
                  No tests completed yet
                </h4>

                <p className="mt-2 text-sm text-slate-500">
                  Choose a subject above and take your first test.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {user.results.map((result) => (
                  <div
                    key={result.id}
                    className="flex flex-col gap-3 px-6 py-5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <h4 className="font-semibold text-slate-900">
                        {result.exam.subject.name}
                      </h4>

                      <p className="text-sm text-slate-500">
                        {result.exam.title}
                      </p>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-lg font-bold text-slate-900">
                          {Number(result.percentage)}%
                        </p>

                        <p className="text-xs text-slate-500">
                          {result.correctAnswers} correct
                        </p>
                      </div>

                      <Link
                        href={`/results/${result.id}`}
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                      >
                        Review
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-12 border-t pt-6 text-center text-sm text-slate-500">
          Student Prep — Learn. Practice. Improve.
        </footer>
      </div>
    </main>
  );
}