import Link from "next/link";

const plans = [
  {
    name: "Free",
    price: "GHS 0",
    description: "Get started with essential practice.",
    features: [
      "5 tests in total",
      "Up to 100 questions per subject",
      "No expiry date",
    ],
  },
  {
    name: "Monthly",
    price: "GHS 10",
    description: "For consistent monthly preparation.",
    features: [
      "Unlimited tests",
      "Up to 500 questions per subject",
      "Valid for 1 month",
    ],
  },
  {
    name: "6 Months",
    price: "GHS 55",
    description: "Prepare throughout the academic term.",
    features: [
      "Unlimited tests",
      "Up to 5,000 questions per subject",
      "Valid for 6 months",
    ],
  },
  {
    name: "1 Year",
    price: "GHS 125",
    description: "Complete year-round preparation.",
    features: [
      "Unlimited tests",
      "Unlimited questions",
      "Valid for 1 year",
    ],
  },
];

const features = [
  {
    icon: "📝",
    title: "Practice Tests",
    description:
      "Take structured practice tests across different subjects and improve through regular practice.",
  },
  {
    icon: "⏱️",
    title: "Timed Exams",
    description:
      "Experience timed examinations designed to help you build speed, accuracy, and confidence.",
  },
  {
    icon: "📊",
    title: "Instant Results",
    description:
      "Review your score, percentage, correct answers, wrong answers, and unanswered questions.",
  },
  {
    icon: "💡",
    title: "Learn From Mistakes",
    description:
      "Review incorrect answers and read explanations so you can understand where you went wrong.",
  },
  {
    icon: "📚",
    title: "Multiple Subjects",
    description:
      "Prepare across the subjects available on the platform and build stronger academic foundations.",
  },
  {
    icon: "📈",
    title: "Track Progress",
    description:
      "Use your exam history and results to monitor your preparation over time.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <img
              src="/logo.jpg"
              alt="Student Prep"
              className="h-11 w-auto object-contain"
            />

            <div>
              <p className="text-lg font-extrabold leading-none text-slate-900">
                Student Prep
              </p>

              <p className="mt-1 text-xs font-medium text-slate-500">
                Prepare. Practise. Progress.
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-7 md:flex">
            <a
              href="#features"
              className="text-sm font-semibold text-slate-600 transition hover:text-blue-600"
            >
              Features
            </a>

            <a
              href="#plans"
              className="text-sm font-semibold text-slate-600 transition hover:text-blue-600"
            >
              Plans
            </a>

            <Link
              href="/login"
              className="text-sm font-semibold text-slate-700 transition hover:text-blue-600"
            >
              Login
            </Link>

            <Link
              href="/register"
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
            >
              Get Started
            </Link>
          </nav>

          <div className="flex items-center gap-2 md:hidden">
            <Link
              href="/login"
              className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700"
            >
              Login
            </Link>

            <Link
              href="/register"
              className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-bold text-white"
            >
              Register
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-white">
        <div className="absolute left-0 top-0 h-72 w-72 rounded-full bg-blue-100/60 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-green-100/50 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8 lg:py-28">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              Your digital exam preparation platform
            </div>

            <h1 className="mt-6 max-w-3xl text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              Prepare smarter.
              <span className="block text-blue-600">
                Practise with confidence.
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              Student Prep gives learners a structured way to practise,
              complete timed tests, review their mistakes, and track their
              academic progress.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
              >
                Start Preparing →
              </Link>

              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-sm font-bold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
              >
                I Already Have an Account
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium text-slate-600">
              <span className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-700">
                  ✓
                </span>
                Timed practice
              </span>

              <span className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-700">
                  ✓
                </span>
                Instant results
              </span>

              <span className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-700">
                  ✓
                </span>
                Mistake review
              </span>

              <span className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-700">
                  ✓
                </span>
                Progress tracking
              </span>
            </div>
          </div>

          {/* Hero Dashboard Preview */}
          <div className="relative">
            <div className="absolute -left-8 -top-8 h-40 w-40 rounded-full bg-blue-200/60 blur-3xl" />
            <div className="absolute -bottom-8 -right-8 h-40 w-40 rounded-full bg-green-200/60 blur-3xl" />

            <div className="relative rounded-3xl border border-slate-200 bg-slate-50 p-4 shadow-2xl sm:p-6">
              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-500">
                      Student Dashboard
                    </p>

                    <p className="mt-1 text-xl font-extrabold text-slate-900">
                      Keep learning
                    </p>
                  </div>

                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-100 font-extrabold text-blue-700">
                    S
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                    <p className="text-xs font-bold text-blue-600">
                      Tests Completed
                    </p>

                    <p className="mt-2 text-2xl font-extrabold text-blue-900">
                      24
                    </p>
                  </div>

                  <div className="rounded-xl border border-green-100 bg-green-50 p-4">
                    <p className="text-xs font-bold text-green-700">
                      Average Score
                    </p>

                    <p className="mt-2 text-2xl font-extrabold text-green-900">
                      78%
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-slate-900">
                      Mathematics Practice
                    </p>

                    <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-bold text-green-700">
                      82%
                    </span>
                  </div>

                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full w-[82%] rounded-full bg-green-500" />
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-slate-900">
                      English Practice
                    </p>

                    <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-700">
                      74%
                    </span>
                  </div>

                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full w-[74%] rounded-full bg-blue-600" />
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between rounded-xl border border-red-100 bg-red-50 p-4">
                  <div>
                    <p className="text-xs font-bold text-red-600">
                      Areas to review
                    </p>

                    <p className="mt-1 text-sm font-semibold text-red-900">
                      3 mistakes to improve
                    </p>
                  </div>

                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-red-100 text-sm font-bold text-red-700">
                    3
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-slate-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-extrabold uppercase tracking-wider text-blue-600">
              Everything you need
            </p>

            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
              A better way to prepare
            </h2>

            <p className="mt-4 text-slate-600">
              Build your confidence through consistent practice and meaningful
              feedback.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg"
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl text-2xl ${
                    index % 3 === 0
                      ? "bg-blue-50"
                      : index % 3 === 1
                        ? "bg-green-50"
                        : "bg-slate-100"
                  }`}
                >
                  {feature.icon}
                </div>

                <h3 className="mt-5 text-lg font-extrabold text-slate-900">
                  {feature.title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-extrabold uppercase tracking-wider text-blue-600">
              Simple process
            </p>

            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
              Start preparing in three steps
            </h2>
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-3">
            <div className="relative text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-lg font-extrabold text-white shadow-lg shadow-blue-600/20">
                1
              </div>

              <h3 className="mt-5 text-lg font-extrabold text-slate-900">
                Create your account
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Register and access your personal Student Prep dashboard.
              </p>
            </div>

            <div className="relative text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-lg font-extrabold text-white shadow-lg shadow-blue-600/20">
                2
              </div>

              <h3 className="mt-5 text-lg font-extrabold text-slate-900">
                Choose a test
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Select an available subject and complete your timed practice
                test.
              </p>
            </div>

            <div className="relative text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-600 text-lg font-extrabold text-white shadow-lg shadow-green-600/20">
                3
              </div>

              <h3 className="mt-5 text-lg font-extrabold text-slate-900">
                Review and improve
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Study your results, review mistakes, and use the feedback to
                improve.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Plans */}
      <section id="plans" className="bg-slate-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-extrabold uppercase tracking-wider text-blue-600">
              Flexible plans
            </p>

            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
              Choose how you want to prepare
            </h2>

            <p className="mt-4 text-slate-600">
              Start for free or choose a plan that matches your preparation
              needs.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {plans.map((plan) => {
              const isFree = plan.name === "Free";
              const isYearly = plan.name === "1 Year";

              return (
                <div
                  key={plan.name}
                  className={`relative flex flex-col rounded-2xl border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${
                    isYearly
                      ? "border-blue-300 ring-2 ring-blue-100"
                      : "border-slate-200"
                  }`}
                >
                  {isYearly && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-3 py-1 text-xs font-bold text-white">
                      Full Year
                    </span>
                  )}

                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-lg font-extrabold text-slate-900">
                      {plan.name}
                    </h3>

                    {isFree && (
                      <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-bold text-green-700">
                        Start Free
                      </span>
                    )}
                  </div>

                  <p className="mt-2 min-h-12 text-sm text-slate-500">
                    {plan.description}
                  </p>

                  <div className="mt-5">
                    <span className="text-3xl font-extrabold text-slate-950">
                      {plan.price}
                    </span>
                  </div>

                  <div className="my-6 h-px bg-slate-200" />

                  <ul className="flex-1 space-y-3">
                    {plan.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex gap-2 text-sm text-slate-600"
                      >
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100 text-xs font-extrabold text-green-700">
                          ✓
                        </span>

                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href="/register"
                    className={`mt-6 rounded-lg px-4 py-2.5 text-center text-sm font-bold transition ${
                      isYearly
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "border border-slate-300 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                    }`}
                  >
                    Get Started
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-blue-600 py-20">
        <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-green-400/20 blur-3xl" />

        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-2xl shadow-lg">
            🎓
          </div>

          <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Ready to start preparing?
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-blue-100">
            Create your Student Prep account and start practising today.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/register"
              className="rounded-xl bg-white px-6 py-3.5 text-sm font-extrabold text-blue-700 shadow-sm transition hover:bg-blue-50"
            >
              Create Free Account
            </Link>

            <Link
              href="/login"
              className="rounded-xl border border-blue-300 px-6 py-3.5 text-sm font-extrabold text-white transition hover:bg-blue-700"
            >
              Login
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div>
            <p className="font-extrabold text-slate-900">Student Prep</p>

            <p className="mt-1 text-sm text-slate-500">
              Prepare. Practise. Progress.
            </p>
          </div>

          <div className="flex gap-5 text-sm font-medium text-slate-500">
            <Link
              href="/login"
              className="transition hover:text-blue-600"
            >
              Login
            </Link>

            <Link
              href="/register"
              className="transition hover:text-blue-600"
            >
              Register
            </Link>
          </div>

          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} Student Prep
          </p>
        </div>
      </footer>
    </main>
  );
}