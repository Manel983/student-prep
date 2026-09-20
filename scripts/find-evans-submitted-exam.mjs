import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

const exam = await prisma.exam.findFirst({
  where: {
    user: {
      email: "evans@agyei.com",
    },
    status: {
      in: ["SUBMITTED", "AUTO_SUBMITTED", "MARKED"],
    },
  },
  orderBy: {
    createdAt: "desc",
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
    result: {
      select: {
        id: true,
        score: true,
        totalMarks: true,
        percentage: true,
        correctAnswers: true,
        wrongAnswers: true,
        unanswered: true,
      },
    },
  },
});

console.log({
  examId: exam?.id,
  title: exam?.title,
  status: exam?.status,
  question: exam?.questions[0] ?? null,
  result: exam?.result ?? null,
});

await prisma.$disconnect();
