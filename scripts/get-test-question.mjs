import "dotenv/config";
import { prisma } from "../src/lib/prisma.ts";

const question = await prisma.question.findFirst({
  where: {
    questionText: "What is 25 + 15?"
  },
  select: {
    id: true,
    questionText: true,
    subjectId: true,
    topicId: true,
    correctAnswer: true,
    status: true
  }
});

console.log(question);

await prisma.$disconnect();