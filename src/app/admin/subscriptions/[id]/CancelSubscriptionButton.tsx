"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface CancelSubscriptionButtonProps {
  subscriptionId: string;
  status: string;
}

export default function CancelSubscriptionButton({
  subscriptionId,
  status,
}: CancelSubscriptionButtonProps) {
  const router = useRouter();

  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState("");

  const canCancel = status === "ACTIVE";

  if (!canCancel) {
    return null;
  }

  async function handleCancel() {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this subscription? The student will no longer be able to use this subscription."
    );

    if (!confirmed) {
      return;
    }

    setIsCancelling(true);
    setError("");

    try {
      const response = await fetch(
        `/api/admin/subscriptions/${subscriptionId}/cancel`,
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data?.message ||
            "Failed to cancel the subscription."
        );
        return;
      }

      router.refresh();
    } catch {
      setError(
        "Something went wrong while cancelling the subscription."
      );
    } finally {
      setIsCancelling(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-3">
      <button
        type="button"
        onClick={handleCancel}
        disabled={isCancelling}
        className="rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isCancelling
          ? "Cancelling..."
          : "Cancel Subscription"}
      </button>

      {error && (
        <p
          role="alert"
          className="text-sm font-medium text-red-600"
        >
          {error}
        </p>
      )}
    </div>
  );
}