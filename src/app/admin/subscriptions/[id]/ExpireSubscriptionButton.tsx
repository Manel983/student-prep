"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ExpireSubscriptionButtonProps {
  subscriptionId: string;
  status: string;
}

export default function ExpireSubscriptionButton({
  subscriptionId,
  status,
}: ExpireSubscriptionButtonProps) {
  const router = useRouter();

  const [isExpiring, setIsExpiring] = useState(false);
  const [error, setError] = useState("");

  const canExpire = status === "ACTIVE";

  if (!canExpire) {
    return null;
  }

  async function handleExpire() {
    const confirmed = window.confirm(
      "Are you sure you want to expire this subscription? The student will no longer be able to use this subscription."
    );

    if (!confirmed) {
      return;
    }

    setIsExpiring(true);
    setError("");

    try {
      const response = await fetch(
        `/api/admin/subscriptions/${subscriptionId}/expire`,
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data?.message ||
            "Failed to expire the subscription."
        );
        return;
      }

      router.refresh();
    } catch {
      setError(
        "Something went wrong while expiring the subscription."
      );
    } finally {
      setIsExpiring(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-3">
      <button
        type="button"
        onClick={handleExpire}
        disabled={isExpiring}
        className="rounded-xl bg-amber-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isExpiring
          ? "Expiring..."
          : "Expire Subscription"}
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