"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    classLevel: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isExiting, setIsExiting] = useState(false);

  function handleChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Registration failed.");
        return;
      }

      setSuccess(
        "Account created successfully! Redirecting to login..."
      );

      setTimeout(() => {
        setIsExiting(true);

        setTimeout(() => {
          router.push("/login");
        }, 250);
      }, 1250);
    } catch {
      setError(
        "Unable to connect to the server. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleLoginNavigation() {
    setIsExiting(true);

    setTimeout(() => {
      router.push("/login");
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

          <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-white/10" />
          <div className="absolute -bottom-32 -right-20 h-80 w-80 rounded-full bg-green-500/20" />

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
                Start your preparation today
              </div>

              <h2 className="text-4xl font-bold leading-tight text-white xl:text-5xl">
                Build confidence.
                <br />
                Practise more.
                <br />
                Achieve more.
              </h2>

              <p className="mt-6 max-w-md text-base leading-7 text-blue-100">
                Create your Student Prep account and get access to
                practice tests, performance tracking, and detailed
                mistake reviews.
              </p>

              <div className="mt-8 space-y-3">
                <div className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3 ring-1 ring-white/10">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-green-500 text-sm font-bold text-white">
                    ✓
                  </span>

                  <span className="text-sm font-medium text-white">
                    Practice with timed tests
                  </span>
                </div>

                <div className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3 ring-1 ring-white/10">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-green-500 text-sm font-bold text-white">
                    ✓
                  </span>

                  <span className="text-sm font-medium text-white">
                    Review your mistakes
                  </span>
                </div>

                <div className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3 ring-1 ring-white/10">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-green-500 text-sm font-bold text-white">
                    ✓
                  </span>

                  <span className="text-sm font-medium text-white">
                    Track your progress
                  </span>
                </div>
              </div>
            </div>

            <p className="text-sm text-blue-100">
              Student Prep — Test your knowledge.
            </p>
          </div>
        </section>

        {/* Registration Section */}
        <section className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6 lg:px-12">
          <div className="w-full max-w-lg">
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
                Get started
              </p>

              <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                Create your account
              </h1>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                Join Student Prep and start testing your knowledge
                today.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50 sm:p-8">
              <form
                onSubmit={handleSubmit}
                className="space-y-5"
              >
                {/* Names */}
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="firstName"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      First Name
                    </label>

                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      value={form.firstName}
                      onChange={handleChange}
                      required
                      autoComplete="given-name"
                      placeholder="John"
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="lastName"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Last Name
                    </label>

                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      value={form.lastName}
                      onChange={handleChange}
                      required
                      autoComplete="family-name"
                      placeholder="Doe"
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                  </div>
                </div>

                {/* Class */}
                <div>
                  <label
                    htmlFor="classLevel"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Class
                  </label>

                  <select
                    id="classLevel"
                    name="classLevel"
                    value={form.classLevel}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition hover:border-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  >
                    <option value="" disabled>
                      Select your class
                    </option>

                    <option value="PRIMARY_1">Primary 1</option>
                    <option value="PRIMARY_2">Primary 2</option>
                    <option value="PRIMARY_3">Primary 3</option>
                    <option value="PRIMARY_4">Primary 4</option>
                    <option value="PRIMARY_5">Primary 5</option>
                    <option value="PRIMARY_6">Primary 6</option>
                    <option value="JHS_1">JHS 1</option>
                    <option value="JHS_2">JHS 2</option>
                    <option value="JHS_3">JHS 3</option>
                  </select>
                </div>

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
                      autoComplete="new-password"
                      placeholder="At least 8 characters"
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

                {/* Confirm Password */}
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Confirm Password
                  </label>

                  <div className="relative">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={
                        showConfirmPassword
                          ? "text"
                          : "password"
                      }
                      value={form.confirmPassword}
                      onChange={handleChange}
                      required
                      autoComplete="new-password"
                      placeholder="Enter your password again"
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 pr-20 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(
                          (current) => !current
                        )
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs font-semibold text-blue-600 transition hover:bg-blue-50 hover:text-blue-800"
                    >
                      {showConfirmPassword
                        ? "Hide"
                        : "Show"}
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

                {/* Success */}
                {success && (
                  <div
                    role="status"
                    className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
                  >
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-600 text-xs font-bold text-white">
                      ✓
                    </span>

                    <span>{success}</span>
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
                      Creating Account...
                    </span>
                  ) : (
                    "Create Account"
                  )}
                </button>
              </form>

              {/* Login Link */}
              <div className="mt-7 border-t border-slate-100 pt-6 text-center">
                <p className="text-sm text-slate-600">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={handleLoginNavigation}
                    className="font-semibold text-blue-600 transition hover:text-blue-800"
                  >
                    Sign in
                  </button>
                </p>
              </div>
            </div>

            {/* Footer */}
            <p className="mt-6 text-center text-xs leading-5 text-slate-500">
              By creating an account, you agree to use Student Prep
              responsibly for educational purposes.
            </p>
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