import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

const user = await prisma.user.findUnique({
  where: { email: "jon@doe.com" },
  include: {
    subscriptions: {
      include: { plan: true },
      orderBy: { createdAt: "desc" },
    },
    payments: {
      orderBy: { createdAt: "desc" },
    },
  },
});

console.log("SUBSCRIPTIONS:");
for (const sub of user?.subscriptions ?? []) {
  console.log({
    id: sub.id,
    plan: sub.plan.name,
    status: sub.status,
    testsUsed: sub.testsUsed,
    expiresAt: sub.expiresAt,
    createdAt: sub.createdAt,
  });
}

console.log("\nPAYMENTS:");
for (const payment of user?.payments ?? []) {
  console.log({
    reference: payment.reference,
    amount: payment.amount.toString(),
    status: payment.status,
    subscriptionId: payment.subscriptionId,
    createdAt: payment.createdAt,
    paidAt: payment.paidAt,
  });
}

await prisma.$disconnect();
