"use client";

import { useState } from "react";

interface PaymentButtonProps {
  planId: string;
  label: string;
  disabled?: boolean;
  highlighted?: boolean;
}

export default function PaymentButton({
  planId,
  label,
  disabled = false,
  highlighted = false,
}: PaymentButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handlePayment() {
    if (loading || disabled) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "/api/payments/initialize",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            planId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(
          data.message ||
            "Unable to initialize payment. Please try again."
        );
        return;
      }

      if (!data.authorizationUrl) {
        setError(
          "Payment checkout could not be created. Please try again."
        );
        return;
      }

      window.location.href = data.authorizationUrl;
    } catch {
      setError(
        "Something went wrong while starting the payment."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handlePayment}
        disabled={disabled || loading}
        aria-busy={loading}
        className={`w-full rounded-lg px-4 py-3 text-sm font-semibold transition ${
          disabled || loading
            ? "cursor-not-allowed bg-slate-100 text-slate-500"
            : highlighted
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
        }`}
      >
        {loading ? "Processing..." : label}
      </button>

      {error && (
        <p className="mt-2 text-center text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}