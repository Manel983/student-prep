import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

const user = await prisma.user.findUnique({
  where: { email: "evans@agyei.com" },
  include: {
    subscriptions: {
      include: { plan: true },
    },
  },
});

const paidSubscription = user?.subscriptions.find(
  (sub) => sub.plan.type !== "FREE" && sub.status === "ACTIVE"
);

if (!paidSubscription) {
  throw new Error("No active paid subscription found.");
}

const pastDate = new Date(Date.now() - 60 * 1000);

await prisma.subscription.update({
  where: { id: paidSubscription.id },
  data: {
    expiresAt: pastDate,
  },
});

console.log({
  plan: paidSubscription.plan.name,
  status: "ACTIVE",
  newExpiresAt: pastDate,
});

await prisma.$disconnect();
