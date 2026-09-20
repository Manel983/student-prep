import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const requestSchema = z.object({
  planId: z.string().min(1),
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
          message: "Invalid plan selection.",
        },
        { status: 400 }
      );
    }

    const { planId } = parsed.data;

    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        {
          success: false,
          message: "User account is unavailable.",
        },
        { status: 403 }
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
          message: "The selected plan is unavailable.",
        },
        { status: 404 }
      );
    }

    if (plan.type === "FREE") {
      return NextResponse.json(
        {
          success: false,
          message: "The Free Plan does not require payment.",
        },
        { status: 400 }
      );
    }

    if (Number(plan.price) <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "This plan cannot be purchased.",
        },
        { status: 400 }
      );
    }

    const activePaidSubscription =
      await prisma.subscription.findFirst({
        where: {
          userId: user.id,
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
                gt: new Date(),
              },
            },
          ],
        },
        include: {
          plan: true,
        },
      });

    if (activePaidSubscription) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You already have an active paid subscription.",
        },
        { status: 409 }
      );
    }

    const existingPendingPayment =
  await prisma.payment.findFirst({
    where: {
      userId: user.id,
      status: "PENDING",
      provider: "PAYSTACK",
      amount: plan.price,
      currency: "GHS",
      createdAt: {
        gt: new Date(
          Date.now() - 30 * 60 * 1000
        ),
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

if (existingPendingPayment) {
  return NextResponse.json(
    {
      success: false,
      message:
        "You already have a pending payment for this plan. Please complete it before starting another payment.",
    },
    { status: 409 }
  );
}

const reference = `STUDENTPREP-${crypto.randomUUID()}`;

const amountInSubunit = Math.round(
  Number(plan.price) * 100
);

    const payment = await prisma.payment.create({
      data: {
        userId: user.id,
        reference,
        amount: plan.price,
        currency: "GHS",
        status: "PENDING",
        provider: "PAYSTACK",
        metadata: {
          planId: plan.id,
          planType: plan.type,
          planName: plan.name,
        },
      },
    });

    const secretKey = process.env.PAYSTACK_SECRET_KEY;

    if (!secretKey) {
      console.error(
        "PAYSTACK_SECRET_KEY is not configured."
      );

      await prisma.payment.update({
        where: {
          id: payment.id,
        },
        data: {
          status: "FAILED",
        },
      });

      return NextResponse.json(
        {
          success: false,
          message:
            "Payment service is not configured yet.",
        },
        { status: 500 }
      );
    }

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";

    const paystackResponse = await fetch(
      "https://api.paystack.co/transaction/initialize",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: user.email,
          amount: String(amountInSubunit),
          currency: "GHS",
          reference,
          callback_url: `${appUrl}/payment/callback`,
          metadata: {
            userId: user.id,
            paymentId: payment.id,
            planId: plan.id,
            planType: plan.type,
          },
        }),
      }
    );

    const paystackData = await paystackResponse.json();

    if (
      !paystackResponse.ok ||
      !paystackData.status ||
      !paystackData.data?.authorization_url
    ) {
      console.error(
        "Paystack initialization failed:",
        paystackData
      );

      await prisma.payment.update({
        where: {
          id: payment.id,
        },
        data: {
          status: "FAILED",
          metadata: {
            planId: plan.id,
            planType: plan.type,
            planName: plan.name,
            paystackResponse: paystackData,
          },
        },
      });

      return NextResponse.json(
        {
          success: false,
          message:
            "Unable to initialize the payment. Please try again.",
        },
        { status: 502 }
      );
    }

    await prisma.payment.update({
      where: {
        id: payment.id,
      },
      data: {
        metadata: {
          planId: plan.id,
          planType: plan.type,
          planName: plan.name,
          accessCode: paystackData.data.access_code,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Payment initialized successfully.",
      authorizationUrl:
        paystackData.data.authorization_url,
      reference: paystackData.data.reference,
    });
  } catch (error) {
    console.error(
      "Payment initialization error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Something went wrong while initializing the payment.",
      },
      { status: 500 }
    );
  }
}