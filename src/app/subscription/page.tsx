import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import PaymentButton from "./PaymentButton";

const planDisplay: Record<
  string,
  {
    icon: string;
    description: string;
    period: string;
    button: string;
  }
> = {
  FREE: {
    icon: "🆓",
    description: "A free starting plan for students.",
    period: "No expiry",
    button: "Current Free Plan",
  },
  MONTHLY: {
    icon: "⭐",
    description: "Unlimited practice for one month.",
    period: "per month",
    button: "Choose Monthly",
  },
  SIX_MONTHS: {
    icon: "🚀",
    description: "A better-value plan for consistent preparation.",
    period: "for 6 months",
    button: "Choose 6 Months",
  },
  YEARLY: {
    icon: "👑",
    description: "The best option for long-term preparation.",
    period: "for 1 year",
    button: "Choose 1 Year",
  },
};

export default async function SubscriptionPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const [plans, user] = await Promise.all([
    prisma.plan.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        price: "asc",
      },
    }),

    prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
      include: {
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
    }),
  ]);

  if (!user) {
    redirect("/login");
  }

  const currentSubscription = user.subscriptions[0];

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-sm font-semibold text-blue-600 transition hover:text-blue-700"
          >
            <span className="text-lg">←</span>
            Back to Dashboard
          </Link>

          <div className="hidden items-center gap-2 text-sm text-slate-500 sm:flex">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            Secure subscription
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-10 sm:py-12">
        {/* Hero */}
        <div className="mx-auto mb-10 max-w-3xl text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-2xl">
            💳
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Choose Your Plan
          </h1>

          <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-slate-600">
            Choose the plan that fits your preparation needs and get access to
            more practice tests and questions.
          </p>
        </div>

        {/* Current subscription */}
        {currentSubscription && (
          <div
            className={`mx-auto mb-10 max-w-3xl rounded-2xl border p-5 ${
              currentSubscription.status === "ACTIVE"
                ? "border-green-200 bg-green-50"
                : currentSubscription.status === "EXPIRED"
                  ? "border-red-200 bg-red-50"
                  : "border-blue-200 bg-blue-50"
            }`}
          >
            <div className="flex flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
              <div>
                <p
                  className={`text-sm font-semibold ${
                    currentSubscription.status === "ACTIVE"
                      ? "text-green-700"
                      : currentSubscription.status === "EXPIRED"
                        ? "text-red-700"
                        : "text-blue-700"
                  }`}
                >
                  Current Plan
                </p>

                <p className="mt-1 text-lg font-bold text-slate-900">
                  {currentSubscription.plan.name}
                </p>
              </div>

              <div
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  currentSubscription.status === "ACTIVE"
                    ? "bg-green-100 text-green-700"
                    : currentSubscription.status === "EXPIRED"
                      ? "bg-red-100 text-red-700"
                      : "bg-blue-100 text-blue-700"
                }`}
              >
                {currentSubscription.status}
              </div>
            </div>
          </div>
        )}

        {/* Plans */}
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {plans.map((plan) => {
            const display = planDisplay[plan.type];

            if (!display) {
              return null;
            }

            const isCurrentPlan =
              currentSubscription?.plan.type === plan.type &&
              currentSubscription.status === "ACTIVE";

            const isBestValue = plan.type === "SIX_MONTHS";
            const isYearly = plan.type === "YEARLY";
            const isFree = plan.type === "FREE";

            return (
              <div
                key={plan.id}
                className={`relative flex flex-col rounded-2xl border bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md ${
                  isBestValue
                    ? "border-blue-500 ring-2 ring-blue-100"
                    : isCurrentPlan
                      ? "border-green-400 ring-2 ring-green-100"
                      : "border-slate-200"
                }`}
              >
                {/* Badge */}
                {isBestValue && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-blue-600 px-4 py-1.5 text-xs font-bold text-white shadow-sm">
                    Best Value
                  </div>
                )}

                {isCurrentPlan && (
                  <div className="absolute -top-3 right-4 rounded-full bg-green-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm">
                    Current Plan
                  </div>
                )}

                {/* Plan heading */}
                <div className="mb-6">
                  <div
                    className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl text-2xl ${
                      isFree
                        ? "bg-slate-100"
                        : isYearly
                          ? "bg-green-100"
                          : "bg-blue-100"
                    }`}
                  >
                    {display.icon}
                  </div>

                  <h2 className="text-xl font-bold text-slate-900">
                    {plan.name}
                  </h2>

                  <p className="mt-2 min-h-[48px] text-sm leading-6 text-slate-600">
                    {display.description}
                  </p>
                </div>

                {/* Price */}
                <div className="mb-6 border-b border-slate-100 pb-6">
                  <div className="text-3xl font-bold text-slate-900">
                    GHS {Number(plan.price).toFixed(2)}
                  </div>

                  <div className="mt-1 text-sm font-medium text-slate-500">
                    {display.period}
                  </div>
                </div>

                {/* Features */}
                <div className="mb-7 flex-1">
                  <h3 className="mb-4 text-sm font-bold text-slate-900">
                    Includes:
                  </h3>

                  <ul className="space-y-3.5">
                    <li className="flex items-start gap-3 text-sm text-slate-600">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-700">
                        ✓
                      </span>

                      <span>
                        {plan.unlimitedTests
                          ? "Unlimited tests"
                          : `${plan.testsAllowed ?? 0} tests total`}
                      </span>
                    </li>

                    <li className="flex items-start gap-3 text-sm text-slate-600">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-700">
                        ✓
                      </span>

                      <span>
                        {plan.unlimitedQuestions
                          ? "Unlimited questions per subject"
                          : `${plan.questionsPerSubject ?? 0} questions per subject`}
                      </span>
                    </li>

                    {plan.durationDays ? (
                      <li className="flex items-start gap-3 text-sm text-slate-600">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-700">
                          ✓
                        </span>

                        <span>Valid for {plan.durationDays} days</span>
                      </li>
                    ) : (
                      <li className="flex items-start gap-3 text-sm text-slate-600">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-700">
                          ✓
                        </span>

                        <span>No subscription expiry</span>
                      </li>
                    )}

                    <li className="flex items-start gap-3 text-sm text-slate-600">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-700">
                        ✓
                      </span>

                      <span>Access to practice tests</span>
                    </li>

                    <li className="flex items-start gap-3 text-sm text-slate-600">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-700">
                        ✓
                      </span>

                      <span>Review your test results</span>
                    </li>
                  </ul>
                </div>

                {/* Action */}
                {plan.type === "FREE" ? (
                  <button
                    type="button"
                    disabled
                    className={`w-full cursor-not-allowed rounded-xl px-4 py-3 text-sm font-bold ${
                      isCurrentPlan
                        ? "bg-green-50 text-green-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {isCurrentPlan ? "Current Free Plan" : "Free Plan"}
                  </button>
                ) : (
                  <PaymentButton
                    planId={plan.id}
                    label={display.button}
                    highlighted={isBestValue}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Free plan information */}
        <div className="mx-auto mt-10 max-w-4xl rounded-2xl border border-blue-200 bg-blue-50 p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-lg">
              ℹ️
            </div>

            <div>
              <p className="font-bold text-blue-900">
                Important about your Free Plan
              </p>

              <p className="mt-2 text-sm leading-6 text-blue-800">
                Your Free Plan gives you 5 tests in total. If you purchase a
                paid subscription, your paid plan provides access according to
                its duration and limits. Any unused Free Plan tests remain
                available after your paid subscription expires.
              </p>
            </div>
          </div>
        </div>

        {/* Trust indicators */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-slate-500">
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            Secure payment
          </span>

          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            Instant plan activation
          </span>

          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            Practice & review
          </span>
        </div>
      </div>
    </main>
  );
}