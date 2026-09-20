import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

interface ExpireSubscriptionRouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(
  request: Request,
  { params }: ExpireSubscriptionRouteContext
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      {
        message: "Unauthorized.",
      },
      {
        status: 401,
      }
    );
  }

  const admin = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      role: true,
      isActive: true,
    },
  });

  if (!admin || !admin.isActive || admin.role !== "ADMIN") {
    return NextResponse.json(
      {
        message: "Forbidden.",
      },
      {
        status: 403,
      }
    );
  }

  const { id } = await params;

  if (!id) {
    return NextResponse.json(
      {
        message: "Subscription ID is required.",
      },
      {
        status: 400,
      }
    );
  }

  const subscription = await prisma.subscription.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      status: true,
      userId: true,
      plan: {
        select: {
          type: true,
          name: true,
        },
      },
    },
  });

  if (!subscription) {
    return NextResponse.json(
      {
        message: "Subscription not found.",
      },
      {
        status: 404,
      }
    );
  }

  if (subscription.status === "EXPIRED") {
    return NextResponse.json(
      {
        message: "Subscription is already expired.",
      },
      {
        status: 409,
      }
    );
  }

  if (subscription.status === "CANCELLED") {
    return NextResponse.json(
      {
        message: "Cancelled subscriptions cannot be expired.",
      },
      {
        status: 409,
      }
    );
  }

  const updatedSubscription =
    await prisma.subscription.update({
      where: {
        id: subscription.id,
      },
      data: {
        status: "EXPIRED",
      },
      select: {
        id: true,
        status: true,
        userId: true,
        plan: {
          select: {
            name: true,
            type: true,
          },
        },
      },
    });

  return NextResponse.json(
    {
      message: "Subscription expired successfully.",
      subscription: updatedSubscription,
    },
    {
      status: 200,
    }
  );
}