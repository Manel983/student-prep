import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { processPaystackPayment } from "@/lib/payments/processPaystackPayment";

const requestSchema = z.object({
  reference: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized.",
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Payment reference is required.",
        },
        { status: 400 }
      );
    }

    const { reference } = parsed.data;

    const payment = await prisma.payment.findUnique({
      where: {
        reference,
      },
    });

    if (!payment) {
      return NextResponse.json(
        {
          success: false,
          message: "Payment record not found.",
        },
        { status: 404 }
      );
    }

    if (payment.userId !== session.user.id) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You are not authorized to verify this payment.",
        },
        { status: 403 }
      );
    }

    if (payment.status === "SUCCESS") {
      return NextResponse.json({
        success: true,
        message: "Payment has already been verified.",
        alreadyVerified: true,
        subscriptionId: payment.subscriptionId,
      });
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY;

    if (!secretKey) {
      console.error(
        "PAYSTACK_SECRET_KEY is not configured."
      );

      return NextResponse.json(
        {
          success: false,
          message: "Payment service is not configured.",
        },
        { status: 500 }
      );
    }

    const paystackResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(
        reference
      )}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${secretKey}`,
        },
        cache: "no-store",
      }
    );

    const paystackData = await paystackResponse.json();

    if (
      !paystackResponse.ok ||
      !paystackData.status ||
      !paystackData.data
    ) {
      console.error(
        "Paystack verification failed:",
        paystackData
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Unable to verify the payment with Paystack.",
        },
        { status: 502 }
      );
    }

    const transaction = paystackData.data;

    const result = await processPaystackPayment({
      reference,
      transaction: {
        id: transaction.id,
        status: transaction.status,
        reference: transaction.reference,
        amount: Number(transaction.amount),
        currency: String(transaction.currency || ""),
      },
    });

    if (result.blocked) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You already have an active paid subscription.",
        },
        { status: 409 }
      );
    }

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: result.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      subscriptionId: result.subscriptionId,
      alreadyProcessed: result.alreadyProcessed ?? false,
    });
  } catch (error) {
    console.error(
      "Payment verification error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Something went wrong while verifying the payment.",
      },
      { status: 500 }
    );
  }
}