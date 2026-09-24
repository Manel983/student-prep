"use client";

import { FormEvent, useState } from "react";
import { getSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isExiting, setIsExiting] = useState(false);

  function handleChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setError("");
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });

      if (!result || result.error) {
        setError("Invalid email or password.");
        return;
      }

      const session = await getSession();

      if (session?.user?.role === "ADMIN") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }

      router.refresh();
    } catch {
      setError("Unable to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleRegisterNavigation() {
    setIsExiting(true);

    setTimeout(() => {
      router.push("/register");
    }, 250);
  }

  return (
    <main
      className={`min-h-screen bg-slate-50 transition-all duration-300 ease-out ${
        isExiting
          ? "translate-y-2 opacity-0"
          : "translate-y-0 opacity-100 animate-[pageEnter_500ms_ease-out]"
      }`}
    >
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* Brand Panel */}
        <section className="relative hidden overflow-hidden bg-blue-600 lg:flex">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-700 via-blue-600 to-blue-500" />

          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10" />
          <div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-green-500/20" />

          <div className="relative z-10 flex w-full flex-col justify-between p-12 xl:p-16">
            <div>
              <div className="flex items-center gap-3">
                <img
                  src="/logo.jpg"
                  alt="Student Prep"
                  className="h-12 w-auto object-contain"
                />

                <span className="text-xl font-bold text-white">
                  Student Prep
                </span>
              </div>
            </div>

            <div className="max-w-lg">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white ring-1 ring-white/20">
                <span className="h-2 w-2 rounded-full bg-green-400" />
                Your preparation starts here
              </div>

              <h2 className="text-4xl font-bold leading-tight text-white xl:text-5xl">
                Learn.
                <br />
                Practise.
                <br />
                Improve.
              </h2>

              <p className="mt-6 max-w-md text-base leading-7 text-blue-100">
                Access practice tests, track your performance, review
                mistakes, and build confidence for your next examination.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-white/10 p-4 ring-1 ring-white/10">
                  <p className="text-2xl font-bold text-white">5+</p>
                  <p className="mt-1 text-xs text-blue-100">
                    Subjects
                  </p>
                </div>

                <div className="rounded-xl bg-white/10 p-4 ring-1 ring-white/10">
                  <p className="text-2xl font-bold text-white">∞</p>
                  <p className="mt-1 text-xs text-blue-100">
                    Practice
                  </p>
                </div>

                <div className="rounded-xl bg-white/10 p-4 ring-1 ring-white/10">
                  <p className="text-2xl font-bold text-white">✓</p>
                  <p className="mt-1 text-xs text-blue-100">
                    Track Progress
                  </p>
                </div>
              </div>
            </div>

            <p className="text-sm text-blue-100">
              Student Prep — Test your knowledge.
            </p>
          </div>
        </section>

        {/* Login Section */}
        <section className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6 lg:px-12">
          <div className="w-full max-w-md">
            {/* Mobile Brand */}
            <div className="mb-8 text-center lg:hidden">
              <img
                src="/logo.jpg"
                alt="Student Prep"
                className="mx-auto mb-4 h-14 w-auto object-contain"
              />

              <p className="text-sm font-semibold text-blue-600">
                STUDENT PREP
              </p>
            </div>

            <div className="mb-8">
              <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
                Welcome back
              </p>

              <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                Sign in to your account
              </h1>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                Continue your preparation and keep improving your
                performance.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50 sm:p-8">
              <form
                onSubmit={handleSubmit}
                className="space-y-5"
              >
                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Email Address
                  </label>

                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    autoComplete="email"
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                {/* Password */}
                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Password
                  </label>

                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      value={form.password}
                      onChange={handleChange}
                      required
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 pr-20 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(
                          (current) => !current
                        )
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs font-semibold text-blue-600 transition hover:bg-blue-50 hover:text-blue-800"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div
                    role="alert"
                    className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                  >
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white">
                      !
                    </span>

                    <span>{error}</span>
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-blue-600 px-4 py-3.5 font-semibold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/25 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Signing In...
                    </span>
                  ) : (
                    "Sign In"
                  )}
                </button>
              </form>

              {/* Registration */}
              <div className="mt-7 border-t border-slate-100 pt-6 text-center">
                <p className="text-sm text-slate-600">
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={handleRegisterNavigation}
                    className="font-semibold text-blue-600 transition hover:text-blue-800"
                  >
                    Create an account
                  </button>
                </p>
              </div>
            </div>

            {/* Trust indicators */}
            <div className="mt-6 flex items-center justify-center gap-5 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                Secure login
              </span>

              <span className="h-3 w-px bg-slate-300" />

              <span>Student Prep</span>
            </div>
          </div>
        </section>
      </div>

      <style jsx global>{`
        @keyframes pageEnter {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </main>
  );
}