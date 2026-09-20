import crypto from "crypto";
import { NextResponse } from "next/server";
import { processPaystackPayment } from "@/lib/payments/processPaystackPayment";

function verifyPaystackSignature(
  payload: string,
  signature: string,
  secretKey: string
) {
  const expectedSignature = crypto
    .createHmac("sha512", secretKey)
    .update(payload)
    .digest("hex");

  const receivedBuffer = Buffer.from(signature, "utf8");
  const expectedBuffer = Buffer.from(expectedSignature, "utf8");

  if (receivedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(
    receivedBuffer,
    expectedBuffer
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
    } catch (error) {
      console.error(
        "Webhook signature verification error:",
        error
      );

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

    let event: {
      event?: string;
      data?: {
        id?: string | number;
        status?: string;
        reference?: string;
        amount?: number;
        currency?: string;
      };
    };

    try {
      event = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid webhook payload.",
        },
        { status: 400 }
      );
    }

    // We only need to process successful Paystack charges.
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
          message: "Invalid webhook transaction data.",
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

    if (
      transaction.id === undefined ||
      transaction.status === undefined ||
      transaction.amount === undefined ||
      transaction.currency === undefined
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Required transaction information is missing.",
        },
        { status: 400 }
      );
    }

    const result = await processPaystackPayment({
      reference,
      transaction: {
        id: transaction.id,
        status: String(transaction.status),
        reference,
        amount: Number(transaction.amount),
        currency: String(transaction.currency),
      },
    });

    if (result.alreadyProcessed) {
      return NextResponse.json({
        success: true,
        message: "Payment was already processed.",
        alreadyProcessed: true,
        subscriptionId: result.subscriptionId,
      });
    }

    if (result.blocked) {
      console.error(
        "Webhook payment processing was blocked:",
        {
          reference,
          subscriptionId: result.subscriptionId,
        }
      );

      return NextResponse.json(
        {
          success: false,
          message: result.message,
        },
        { status: 409 }
      );
    }

    if (!result.success) {
      console.error(
        "Webhook payment processing failed:",
        {
          reference,
          message: result.message,
        }
      );

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
      message:
        "Payment webhook processed successfully.",
      paymentId: result.paymentId,
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