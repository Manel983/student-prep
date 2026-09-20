import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

interface RenewSubscriptionRouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(
  request: Request,
  { params }: RenewSubscriptionRouteContext
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { message: "Unauthorized." },
      { status: 401 }
    );
  }

  const admin = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      role: true,
      isActive: true,
    },
  });

  if (!admin || !admin.isActive || admin.role !== "ADMIN") {
    return NextResponse.json(
      { message: "Forbidden." },
      { status: 403 }
    );
  }

  const { id } = await params;

  if (!id) {
    return NextResponse.json(
      { message: "Subscription ID is required." },
      { status: 400 }
    );
  }

  const subscription = await prisma.subscription.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
      status: true,
      testsUsed: true,
      freeTestsUsed: true,
      paymentRequired: true,
      plan: {
        select: {
          id: true,
          name: true,
          type: true,
          durationDays: true,
          unlimitedTests: true,
          testsAllowed: true,
        },
      },
    },
  });

  if (!subscription) {
    return NextResponse.json(
      { message: "Subscription not found." },
      { status: 404 }
    );
  }

  if (subscription.status === "ACTIVE") {
    return NextResponse.json(
      { message: "Active subscriptions cannot be renewed." },
      { status: 409 }
    );
  }

  if (subscription.status === "CANCELLED") {
    return NextResponse.json(
      { message: "Cancelled subscriptions cannot be renewed." },
      { status: 409 }
    );
  }

  if (subscription.status === "PENDING") {
    return NextResponse.json(
      { message: "Pending subscriptions cannot be renewed." },
      { status: 409 }
    );
  }

  if (subscription.status !== "EXPIRED") {
    return NextResponse.json(
      { message: "Only expired subscriptions can be renewed." },
      { status: 409 }
    );
  }

  if (
    subscription.plan.type !== "MONTHLY" &&
    subscription.plan.type !== "SIX_MONTHS" &&
    subscription.plan.type !== "YEARLY"
  ) {
    return NextResponse.json(
      {
        message:
          "Only paid subscriptions can be renewed through this action.",
      },
      { status: 409 }
    );
  }

  if (!subscription.plan.durationDays) {
    return NextResponse.json(
      {
        message:
          "This subscription plan does not have a valid duration.",
      },
      { status: 409 }
    );
  }

  const now = new Date();

  const expiresAt = new Date(now);

  expiresAt.setDate(
    expiresAt.getDate() + subscription.plan.durationDays
  );

  const updatedSubscription = await prisma.subscription.update({
    where: {
      id: subscription.id,
    },
    data: {
      status: "ACTIVE",
      startedAt: now,
      expiresAt,
      testsUsed: 0,
      freeTestsUsed: 0,
      paymentRequired: false,
    },
    select: {
      id: true,
      userId: true,
      status: true,
      startedAt: true,
      expiresAt: true,
      testsUsed: true,
      freeTestsUsed: true,
      paymentRequired: true,
      plan: {
        select: {
          name: true,
          type: true,
          durationDays: true,
        },
      },
    },
  });

  return NextResponse.json(
    {
      message: "Subscription renewed successfully.",
      subscription: updatedSubscription,
    },
    { status: 200 }
  );
}