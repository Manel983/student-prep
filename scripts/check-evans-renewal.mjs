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
      orderBy: { createdAt: "desc" },
    },
  },
});

for (const sub of user?.subscriptions ?? []) {
  console.log({
    id: sub.id,
    plan: sub.plan.name,
    status: sub.status,
    testsUsed: sub.testsUsed,
    expiresAt: sub.expiresAt,
  });
}

await prisma.$disconnect();
