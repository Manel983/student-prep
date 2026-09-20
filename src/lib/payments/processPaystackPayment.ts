import { prisma } from "@/lib/prisma";

interface ProcessPaystackPaymentInput {
  reference: string;
  transaction: {
    id: string | number;
    status: string;
    reference: string;
    amount: number;
    currency: string;
  };
}

interface ProcessPaystackPaymentResult {
  success: boolean;
  alreadyProcessed?: boolean;
  blocked?: boolean;
  paymentId?: string;
  subscriptionId?: string | null;
  message: string;
}

export async function processPaystackPayment({
  reference,
  transaction,
}: ProcessPaystackPaymentInput): Promise<ProcessPaystackPaymentResult> {
  const payment = await prisma.payment.findUnique({
    where: {
      reference,
    },
  });

  if (!payment) {
    return {
      success: false,
      message: "Payment record not found.",
    };
  }

  if (payment.status === "SUCCESS") {
    return {
      success: true,
      alreadyProcessed: true,
      paymentId: payment.id,
      subscriptionId: payment.subscriptionId,
      message: "Payment was already processed.",
    };
  }

  const expectedAmount = Math.round(
    Number(payment.amount) * 100
  );

  const receivedAmount = Number(transaction.amount);

  if (receivedAmount !== expectedAmount) {
    console.error("Paystack amount mismatch:", {
      reference,
      expectedAmount,
      receivedAmount,
    });

    return {
      success: false,
      message: "Payment amount mismatch.",
    };
  }

  const receivedCurrency = String(
    transaction.currency || ""
  ).toUpperCase();

  const expectedCurrency = String(
    payment.currency || ""
  ).toUpperCase();

  if (receivedCurrency !== expectedCurrency) {
    console.error("Paystack currency mismatch:", {
      reference,
      expectedCurrency,
      receivedCurrency,
    });

    return {
      success: false,
      message: "Payment currency mismatch.",
    };
  }

  if (transaction.reference !== payment.reference) {
    console.error("Paystack reference mismatch:", {
      expectedReference: payment.reference,
      receivedReference: transaction.reference,
    });

    return {
      success: false,
      message: "Payment reference mismatch.",
    };
  }

  if (transaction.status !== "success") {
    return {
      success: false,
      message: "The Paystack transaction was not successful.",
    };
  }

  const metadata = payment.metadata;

  if (
    !metadata ||
    typeof metadata !== "object" ||
    Array.isArray(metadata)
  ) {
    return {
      success: false,
      message: "Payment metadata is invalid.",
    };
  }

  const planId = metadata.planId;

  if (
    typeof planId !== "string" ||
    planId.length === 0
  ) {
    return {
      success: false,
      message: "Payment plan information is missing.",
    };
  }

  const plan = await prisma.plan.findUnique({
    where: {
      id: planId,
    },
  });

  if (!plan || !plan.isActive) {
    return {
      success: false,
      message: "The payment plan is unavailable.",
    };
  }

  if (plan.type === "FREE") {
    return {
      success: false,
      message:
        "The Free Plan cannot be activated by payment.",
    };
  }

  const now = new Date();

  const expiresAt = plan.durationDays
    ? new Date(
        now.getTime() +
          plan.durationDays * 24 * 60 * 60 * 1000
      )
    : null;

  const result = await prisma.$transaction(
    async (tx) => {
      const currentPayment =
        await tx.payment.findUnique({
          where: {
            reference,
          },
        });

      if (!currentPayment) {
        throw new Error(
          "Payment record disappeared during processing."
        );
      }

      // Prevent two concurrent successful payments for the
      // same user from creating multiple active subscriptions.
      await tx.$executeRaw`
  SELECT pg_advisory_xact_lock(
    hashtext(${currentPayment.userId})
  );
`;

      // Re-check the payment after acquiring the lock.
      const lockedPayment =
        await tx.payment.findUnique({
          where: {
            reference,
          },
        });

      if (!lockedPayment) {
        throw new Error(
          "Payment record disappeared during processing."
        );
      }

      if (lockedPayment.status === "SUCCESS") {
        return {
          alreadyProcessed: true,
          paymentId: lockedPayment.id,
          subscriptionId:
            lockedPayment.subscriptionId,
        };
      }

      const activePaidSubscription =
        await tx.subscription.findFirst({
          where: {
            userId: lockedPayment.userId,
            status: "ACTIVE",
            plan: {
              type: {
                not: "FREE",
              },
            },
            OR: [
              {
                expiresAt: null,
              },
              {
                expiresAt: {
                  gt: now,
                },
              },
            ],
          },
        });

      if (activePaidSubscription) {
        return {
          blocked: true,
          paymentId: lockedPayment.id,
          subscriptionId:
            activePaidSubscription.id,
        };
      }

      const subscription =
        await tx.subscription.create({
          data: {
            userId: lockedPayment.userId,
            planId: plan.id,
            status: "ACTIVE",
            startedAt: now,
            expiresAt,
            testsUsed: 0,
            freeTestsUsed: 0,
            paymentRequired: true,
          },
        });

      await tx.payment.update({
        where: {
          id: lockedPayment.id,
        },
        data: {
          status: "SUCCESS",
          paidAt: now,
          subscriptionId: subscription.id,
          metadata: {
            ...metadata,
            verifiedAt: now.toISOString(),
            paystackStatus: transaction.status,
            paystackReference:
              transaction.reference,
            paystackTransactionId:
              transaction.id,
          },
        },
      });

      return {
        success: true,
        paymentId: lockedPayment.id,
        subscriptionId: subscription.id,
      };
    }
  );
  if (
    "alreadyProcessed" in result &&
    result.alreadyProcessed
  ) {
    return {
      success: true,
      alreadyProcessed: true,
      paymentId: result.paymentId,
      subscriptionId: result.subscriptionId,
      message: "Payment was already processed.",
    };
  }

  if ("blocked" in result && result.blocked) {
    return {
      success: false,
      blocked: true,
      paymentId: result.paymentId,
      subscriptionId: result.subscriptionId,
      message:
        "An active paid subscription already exists.",
    };
  }

  return {
    success: true,
    paymentId: result.paymentId,
    subscriptionId: result.subscriptionId,
    message:
      "Payment and subscription processed successfully.",
  };
}