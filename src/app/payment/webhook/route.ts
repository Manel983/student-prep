import crypto from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function verifyPaystackSignature(
  payload: string,
  signature: string,
  secretKey: string
) {
  const expectedSignature = crypto
    .createHmac("sha512", secretKey)
    .update(payload)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

export async function POST(request: Request) {
  try {
    const secretKey = process.env.PAYSTACK_SECRET_KEY;

    if (!secretKey) {
      console.error(
        "PAYSTACK_SECRET_KEY is not configured."
      );

      return NextResponse.json(
        {
          success: false,
          message: "Webhook configuration error.",
        },
        { status: 500 }
      );
    }

    const signature =
      request.headers.get("x-paystack-signature");

    if (!signature) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing webhook signature.",
        },
        { status: 401 }
      );
    }

    const rawBody = await request.text();

    let signatureIsValid = false;

    try {
      signatureIsValid = verifyPaystackSignature(
        rawBody,
        signature,
        secretKey
      );
    } catch {
      signatureIsValid = false;
    }

    if (!signatureIsValid) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid webhook signature.",
        },
        { status: 401 }
      );
    }

    const event = JSON.parse(rawBody);

    if (event.event !== "charge.success") {
      return NextResponse.json({
        success: true,
        message: "Event received and ignored.",
      });
    }

    const transaction = event.data;

    if (!transaction) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid webhook payload.",
        },
        { status: 400 }
      );
    }

    const reference = transaction.reference;

    if (
      typeof reference !== "string" ||
      reference.trim().length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Payment reference is missing.",
        },
        { status: 400 }
      );
    }

    const payment = await prisma.payment.findUnique({
      where: {
        reference,
      },
    });

    if (!payment) {
      console.error(
        "Webhook payment not found:",
        reference
      );

      return NextResponse.json(
        {
          success: false,
          message: "Payment record not found.",
        },
        { status: 404 }
      );
    }

    if (payment.status === "SUCCESS") {
      return NextResponse.json({
        success: true,
        message: "Payment was already processed.",
        alreadyProcessed: true,
      });
    }

    const expectedAmount = Math.round(
      Number(payment.amount) * 100
    );

    const receivedAmount = Number(transaction.amount);

    const receivedCurrency = String(
      transaction.currency || ""
    ).toUpperCase();

    if (receivedAmount !== expectedAmount) {
      console.error(
        "Webhook amount mismatch:",
        {
          reference,
          expectedAmount,
          receivedAmount,
        }
      );

      return NextResponse.json(
        {
          success: false,
          message: "Payment amount mismatch.",
        },
        { status: 400 }
      );
    }

    if (receivedCurrency !== payment.currency) {
      console.error(
        "Webhook currency mismatch:",
        {
          reference,
          expectedCurrency: payment.currency,
          receivedCurrency,
        }
      );

      return NextResponse.json(
        {
          success: false,
          message: "Payment currency mismatch.",
        },
        { status: 400 }
      );
    }

    const metadata = payment.metadata;

    if (
      !metadata ||
      typeof metadata !== "object" ||
      Array.isArray(metadata)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Payment metadata is invalid.",
        },
        { status: 400 }
      );
    }

    const planId = metadata.planId;

    if (
      typeof planId !== "string" ||
      planId.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Payment plan information is missing.",
        },
        { status: 400 }
      );
    }

    const plan = await prisma.plan.findUnique({
      where: {
        id: planId,
      },
    });

    if (!plan || !plan.isActive) {
      return NextResponse.json(
        {
          success: false,
          message: "The payment plan is unavailable.",
        },
        { status: 400 }
      );
    }

    if (plan.type === "FREE") {
      return NextResponse.json(
        {
          success: false,
          message: "The Free Plan cannot be activated by payment.",
        },
        { status: 400 }
      );
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

        if (currentPayment.status === "SUCCESS") {
          return {
            alreadyProcessed: true,
            subscriptionId:
              currentPayment.subscriptionId,
          };
        }

        const activePaidSubscription =
          await tx.subscription.findFirst({
            where: {
              userId: currentPayment.userId,
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
            subscriptionId:
              activePaidSubscription.id,
          };
        }

        const subscription =
          await tx.subscription.create({
            data: {
              userId: currentPayment.userId,
              planId: plan.id,
              status: "ACTIVE",
              startedAt: now,
              expiresAt,
              testsUsed: 0,
              freeTestsUsed: 0,
              paymentRequired: true,
            },
          });

        const updatedPayment =
          await tx.payment.update({
            where: {
              id: currentPayment.id,
            },
            data: {
              status: "SUCCESS",
              paidAt: now,
              subscriptionId: subscription.id,
              metadata: {
                ...metadata,
                webhookProcessedAt:
                  now.toISOString(),
                paystackStatus:
                  transaction.status,
                paystackReference:
                  transaction.reference,
                paystackTransactionId:
                  transaction.id,
              },
            },
          });

        return {
          success: true,
          subscriptionId: subscription.id,
          paymentId: updatedPayment.id,
        };
      }
    );

    if ("blocked" in result && result.blocked) {
      console.error(
        "Webhook found an existing active paid subscription:",
        {
          reference,
          subscriptionId: result.subscriptionId,
        }
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "An active paid subscription already exists.",
        },
        { status: 409 }
      );
    }

    if (
      "alreadyProcessed" in result &&
      result.alreadyProcessed
    ) {
      return NextResponse.json({
        success: true,
        message: "Payment was already processed.",
        alreadyProcessed: true,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Payment webhook processed successfully.",
      subscriptionId: result.subscriptionId,
    });
  } catch (error) {
    console.error(
      "Paystack webhook error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Webhook processing failed.",
      },
      { status: 500 }
    );
  }
}