"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface PaymentVerificationProps {
  reference: string;
}

export default function PaymentVerification({
  reference,
}: PaymentVerificationProps) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function verifyPayment() {
      try {
        const response = await fetch(
          "/api/payments/verify",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              reference,
            }),
          }
        );

        const data = await response.json();

        if (cancelled) return;

        if (!response.ok || !data.success) {
          setError(
            data.message ||
              "We could not verify your payment."
          );
          setLoading(false);
          return;
        }

        router.replace("/dashboard");
      } catch {
        if (cancelled) return;

        setError(
          "Something went wrong while verifying your payment."
        );
        setLoading(false);
      }
    }

    verifyPayment();

    return () => {
      cancelled = true;
    };
  }, [reference, router]);

  if (loading) {
    return (
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
        <div className="text-4xl">⏳</div>

        <h1 className="mt-4 text-2xl font-bold text-slate-900">
          Verifying Payment
        </h1>

        <p className="mt-3 text-sm text-slate-600">
          Please wait while we confirm your payment with Paystack.
        </p>

        <p className="mt-4 break-all text-xs text-slate-400">
          Reference: {reference}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
      <div className="text-4xl">❌</div>

      <h1 className="mt-4 text-2xl font-bold text-slate-900">
        Payment Verification Failed
      </h1>

      <p className="mt-3 text-sm text-slate-600">
        {error}
      </p>

      <p className="mt-4 break-all text-xs text-slate-400">
        Reference: {reference}
      </p>

      <Link
        href="/subscription"
        className="mt-6 inline-block rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
      >
        Back to Subscription
      </Link>
    </div>
  );
}