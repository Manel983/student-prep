import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

const subscriptions = await prisma.subscription.findMany({
  where: {
    plan: {
      type: "FREE",
    },
    status: "ACTIVE",
    testsUsed: {
      gt: 0,
      lt: 5,
    },
  },
  include: {
    user: {
      select: {
        email: true,
        firstName: true,
        lastName: true,
      },
    },
    plan: true,
  },
  orderBy: {
    testsUsed: "desc",
  },
});

for (const free of subscriptions) {
  const paid = await prisma.subscription.findFirst({
    where: {
      userId: free.userId,
      plan: {
        type: {
          not: "FREE",
        },
      },
    },
    include: {
      plan: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  console.log({
    email: free.user.email,
    name: `${free.user.firstName} ${free.user.lastName}`,
    freeTestsUsed: free.testsUsed,
    freeStatus: free.status,
    paidPlan: paid?.plan.name ?? null,
    paidStatus: paid?.status ?? null,
    paidExpiresAt: paid?.expiresAt ?? null,
  });
}

await prisma.$disconnect();
