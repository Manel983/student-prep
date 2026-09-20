"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface RenewSubscriptionButtonProps {
  subscriptionId: string;
  status: string;
}

export default function RenewSubscriptionButton({
  subscriptionId,
  status,
}: RenewSubscriptionButtonProps) {
  const router = useRouter();

  const [isRenewing, setIsRenewing] = useState(false);
  const [error, setError] = useState("");

  const canRenew = status === "EXPIRED";

  if (!canRenew) {
    return null;
  }

  async function handleRenew() {
    const confirmed = window.confirm(
      "Are you sure you want to renew this subscription? The subscription will become active again with a new plan period."
    );

    if (!confirmed) {
      return;
    }

    setIsRenewing(true);
    setError("");

    try {
      const response = await fetch(
        `/api/admin/subscriptions/${subscriptionId}/renew`,
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data?.message ||
            "Failed to renew the subscription."
        );
        return;
      }

      router.refresh();
    } catch {
      setError(
        "Something went wrong while renewing the subscription."
      );
    } finally {
      setIsRenewing(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-3">
      <button
        type="button"
        onClick={handleRenew}
        disabled={isRenewing}
        className="rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isRenewing
          ? "Renewing..."
          : "Renew Subscription"}
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