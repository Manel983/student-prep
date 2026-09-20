import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

const exam = await prisma.exam.findFirst({
  where: {
    user: {
      email: "janet@adjoa.com",
    },
  },
  orderBy: {
    createdAt: "desc",
  },
  select: {
    id: true,
    title: true,
    status: true,
    user: {
      select: {
        email: true,
      },
    },
    subject: {
      select: {
        name: true,
      },
    },
    createdAt: true,
  },
});

console.log(exam);

await prisma.$disconnect();
