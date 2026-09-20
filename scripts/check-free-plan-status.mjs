import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

const planId = "cmtnml1y80000zcwq088x8wp";

const plan = await prisma.plan.findUnique({
  where: { id: planId },
  select: {
    id: true,
    name: true,
    type: true,
    price: true,
    isActive: true,
  },
});

console.log("Free Plan:");
console.log(plan);

await prisma.$disconnect();
