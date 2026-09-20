import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

const exam = await prisma.exam.findUnique({
  where: {
    id: "cmu73zft100o4qwwqk0vnk8kf",
  },
  include: {
    questions: {
      orderBy: {
        questionNo: "asc",
      },
      take: 1,
      select: {
        questionId: true,
        questionNo: true,
      },
    },
  },
});

console.log({
  examId: exam?.id,
  owner: "janet@adjoa.com",
  status: exam?.status,
  question: exam?.questions[0] ?? null,
});

await prisma.$disconnect();
