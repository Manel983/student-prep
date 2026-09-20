import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

const emails = ["jon@test.com", "jon@doe.com"];

for (const email of emails) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      subscriptions: {
        include: { plan: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  console.log(`\n===== ${email} =====`);

  for (const sub of user?.subscriptions ?? []) {
    console.log({
      plan: sub.plan.name,
      status: sub.status,
      testsUsed: sub.testsUsed,
      expiresAt: sub.expiresAt,
    });
  }
}

await prisma.$disconnect();
