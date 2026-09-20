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
      <div className="mx-auto max-w-7xl px-6 py-10">
        {/* Header */}
        <div className="mb-10 text-center">
          <Link
            href="/dashboard"
            className="mb-6 inline-block text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            ← Back to Dashboard
          </Link>

          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Choose Your Plan
          </h1>

          <p className="mx-auto mt-3 max-w-2xl text-slate-600">
            Choose the plan that fits your preparation needs and get access to
            more practice tests and questions.
          </p>
        </div>

        {/* Current subscription */}
        {currentSubscription && (
          <div className="mx-auto mb-8 max-w-3xl rounded-xl border border-blue-100 bg-blue-50 p-5 text-center">
            <p className="text-sm text-blue-700">
              Current Plan
            </p>

            <p className="mt-1 text-lg font-bold text-blue-900">
              {currentSubscription.plan.name}
            </p>

            <p className="mt-1 text-sm text-blue-700">
              Status: {currentSubscription.status}
            </p>
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

            return (
              <div
                key={plan.id}
                className={`relative flex flex-col rounded-2xl border bg-white p-6 shadow-sm ${
                  plan.type === "SIX_MONTHS"
                    ? "border-blue-500 ring-2 ring-blue-100"
                    : "border-slate-200"
                }`}
              >
                {/* Best value */}
                {plan.type === "SIX_MONTHS" && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
                    Best Value
                  </div>
                )}

                <div className="mb-5">
                  <div className="mb-3 text-3xl">
                    {display.icon}
                  </div>

                  <h2 className="text-xl font-bold text-slate-900">
                    {plan.name}
                  </h2>

                  <p className="mt-2 min-h-[48px] text-sm text-slate-600">
                    {display.description}
                  </p>
                </div>

                {/* Price */}
                <div className="mb-6">
                  <div className="text-3xl font-bold text-slate-900">
                    GHS {Number(plan.price).toFixed(2)}
                  </div>

                  <div className="mt-1 text-sm text-slate-500">
                    {display.period}
                  </div>
                </div>

                {/* Features */}
                <div className="mb-6 flex-1">
                  <h3 className="mb-3 text-sm font-semibold text-slate-900">
                    Includes:
                  </h3>

                  <ul className="space-y-3">
                    <li className="flex items-start gap-2 text-sm text-slate-600">
                      <span className="mt-0.5 text-green-600">
                        ✓
                      </span>

                      <span>
                        {plan.unlimitedTests
                          ? "Unlimited tests"
                          : `${plan.testsAllowed ?? 0} tests total`}
                      </span>
                    </li>

                    <li className="flex items-start gap-2 text-sm text-slate-600">
                      <span className="mt-0.5 text-green-600">
                        ✓
                      </span>

                      <span>
                        {plan.unlimitedQuestions
                          ? "Unlimited questions per subject"
                          : `${plan.questionsPerSubject ?? 0} questions per subject`}
                      </span>
                    </li>

                    {plan.durationDays ? (
                      <li className="flex items-start gap-2 text-sm text-slate-600">
                        <span className="mt-0.5 text-green-600">
                          ✓
                        </span>

                        <span>
                          Valid for {plan.durationDays} days
                        </span>
                      </li>
                    ) : (
                      <li className="flex items-start gap-2 text-sm text-slate-600">
                        <span className="mt-0.5 text-green-600">
                          ✓
                        </span>

                        <span>No subscription expiry</span>
                      </li>
                    )}

                    <li className="flex items-start gap-2 text-sm text-slate-600">
                      <span className="mt-0.5 text-green-600">
                        ✓
                      </span>

                      <span>Access to practice tests</span>
                    </li>

                    <li className="flex items-start gap-2 text-sm text-slate-600">
                      <span className="mt-0.5 text-green-600">
                        ✓
                      </span>

                      <span>Review your test results</span>
                    </li>
                  </ul>
                </div>

                {/* Button */}
                {plan.type === "FREE" ? (
                  <button
                    type="button"
                    disabled
                    className="w-full cursor-not-allowed rounded-lg bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-500"
                  >
                    {isCurrentPlan
                      ? "Current Free Plan"
                      : "Free Plan"}
                  </button>
                ) : (
                  <PaymentButton
                    planId={plan.id}
                    label={display.button}
                    highlighted={plan.type === "SIX_MONTHS"}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Free plan information */}
        <div className="mx-auto mt-10 max-w-3xl rounded-xl border border-blue-100 bg-blue-50 p-5 text-sm text-blue-900">
          <p className="font-semibold">
            Important:
          </p>

          <p className="mt-1">
            Your Free Plan gives you 5 tests in total. If you purchase
            a paid subscription, your paid plan provides access according
            to its duration and limits. Any unused Free Plan tests remain
            available after your paid subscription expires.
          </p>
        </div>
      </div>
    </main>
  );
}