import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  console.log("🌱 Starting Student Prep database seed...");

  // --------------------------------------------------
  // SUBSCRIPTION PLANS
  // --------------------------------------------------

  await prisma.plan.upsert({
    where: { type: "FREE" },
    update: {},
    create: {
      name: "Free",
      type: "FREE",
      price: 0,
      durationDays: null,
      testsAllowed: 5,
      questionsPerSubject: 100,
      unlimitedTests: false,
      unlimitedQuestions: false,
      description: "Free access for students.",
      isActive: true,
    },
  });

  await prisma.plan.upsert({
    where: { type: "MONTHLY" },
    update: {},
    create: {
      name: "Monthly",
      type: "MONTHLY",
      price: 10,
      durationDays: 30,
      testsAllowed: null,
      questionsPerSubject: 500,
      unlimitedTests: true,
      unlimitedQuestions: false,
      description: "Unlimited tests for 30 days.",
      isActive: true,
    },
  });

  await prisma.plan.upsert({
    where: { type: "SIX_MONTHS" },
    update: {},
    create: {
      name: "6 Months",
      type: "SIX_MONTHS",
      price: 55,
      durationDays: 180,
      testsAllowed: null,
      questionsPerSubject: 5000,
      unlimitedTests: true,
      unlimitedQuestions: false,
      description: "Unlimited tests for 6 months.",
      isActive: true,
    },
  });

  await prisma.plan.upsert({
    where: { type: "YEARLY" },
    update: {},
    create: {
      name: "Yearly",
      type: "YEARLY",
      price: 125,
      durationDays: 365,
      testsAllowed: null,
      questionsPerSubject: null,
      unlimitedTests: true,
      unlimitedQuestions: true,
      description: "Unlimited tests and questions for one year.",
      isActive: true,
    },
  });

  console.log("✅ Subscription plans created.");

  // --------------------------------------------------
  // SUBJECTS
  // --------------------------------------------------

  const subjectNames = [
    "Mathematics",
    "English Language",
    "Science",
    "Social Studies",
    "Computing",
  ];

  const subjects: Record<string, string> = {};

  for (const name of subjectNames) {
    const subject = await prisma.subject.upsert({
      where: { name },
      update: {},
      create: {
        name,
        description: `${name} preparation and practice tests.`,
        isActive: true,
      },
    });

    subjects[name] = subject.id;
  }

  console.log("✅ Subjects created.");

  // --------------------------------------------------
  // MATHEMATICS TOPICS
  // --------------------------------------------------

  const mathematicsId = subjects["Mathematics"];

  const arithmeticTopic = await prisma.topic.upsert({
    where: {
      subjectId_name: {
        subjectId: mathematicsId,
        name: "Arithmetic",
      },
    },
    update: {},
    create: {
      subjectId: mathematicsId,
      name: "Arithmetic",
      description: "Basic arithmetic operations and number concepts.",
    },
  });

  const fractionsTopic = await prisma.topic.upsert({
    where: {
      subjectId_name: {
        subjectId: mathematicsId,
        name: "Fractions",
      },
    },
    update: {},
    create: {
      subjectId: mathematicsId,
      name: "Fractions",
      description: "Fractions, decimals and related calculations.",
    },
  });

  const geometryTopic = await prisma.topic.upsert({
    where: {
      subjectId_name: {
        subjectId: mathematicsId,
        name: "Geometry",
      },
    },
    update: {},
    create: {
      subjectId: mathematicsId,
      name: "Geometry",
      description: "Shapes, angles, perimeter and area.",
    },
  });

  const algebraTopic = await prisma.topic.upsert({
    where: {
      subjectId_name: {
        subjectId: mathematicsId,
        name: "Basic Algebra",
      },
    },
    update: {},
    create: {
      subjectId: mathematicsId,
      name: "Basic Algebra",
      description: "Basic algebraic expressions and equations.",
    },
  });

  // --------------------------------------------------
  // MATHEMATICS QUESTIONS
  // --------------------------------------------------

  const questions = [
    {
      topicId: arithmeticTopic.id,
      questionText: "What is 25 × 4?",
      optionA: "50",
      optionB: "75",
      optionC: "100",
      optionD: "125",
      correctAnswer: "C",
      explanation: "25 × 4 = 100.",
      difficulty: "EASY" as const,
    },
    {
      topicId: arithmeticTopic.id,
      questionText: "What is 144 ÷ 12?",
      optionA: "10",
      optionB: "12",
      optionC: "14",
      optionD: "16",
      correctAnswer: "B",
      explanation: "144 divided by 12 equals 12.",
      difficulty: "EASY" as const,
    },
    {
      topicId: arithmeticTopic.id,
      questionText: "What is 35 + 48?",
      optionA: "73",
      optionB: "83",
      optionC: "93",
      optionD: "103",
      correctAnswer: "B",
      explanation: "35 + 48 = 83.",
      difficulty: "EASY" as const,
    },
    {
      topicId: arithmeticTopic.id,
      questionText: "What is 1000 − 375?",
      optionA: "525",
      optionB: "575",
      optionC: "625",
      optionD: "675",
      correctAnswer: "C",
      explanation: "1000 − 375 = 625.",
      difficulty: "EASY" as const,
    },
    {
      topicId: arithmeticTopic.id,
      questionText: "Which number is the largest?",
      optionA: "0.45",
      optionB: "0.54",
      optionC: "0.405",
      optionD: "0.504",
      correctAnswer: "B",
      explanation: "0.54 is greater than 0.504, 0.45 and 0.405.",
      difficulty: "MEDIUM" as const,
    },
    {
      topicId: fractionsTopic.id,
      questionText: "What is 1/2 + 1/4?",
      optionA: "1/4",
      optionB: "2/4",
      optionC: "3/4",
      optionD: "4/4",
      correctAnswer: "C",
      explanation: "1/2 = 2/4, so 2/4 + 1/4 = 3/4.",
      difficulty: "EASY" as const,
    },
    {
      topicId: fractionsTopic.id,
      questionText: "What is 3/4 − 1/4?",
      optionA: "1/4",
      optionB: "1/2",
      optionC: "2/3",
      optionD: "3/4",
      correctAnswer: "B",
      explanation: "3/4 − 1/4 = 2/4 = 1/2.",
      difficulty: "EASY" as const,
    },
    {
      topicId: fractionsTopic.id,
      questionText: "Which fraction is equivalent to 1/2?",
      optionA: "2/3",
      optionB: "2/4",
      optionC: "3/5",
      optionD: "4/6",
      correctAnswer: "B",
      explanation: "Multiplying both numerator and denominator of 1/2 by 2 gives 2/4.",
      difficulty: "EASY" as const,
    },
    {
      topicId: fractionsTopic.id,
      questionText: "What is 0.75 as a fraction in its simplest form?",
      optionA: "1/2",
      optionB: "2/3",
      optionC: "3/4",
      optionD: "4/5",
      correctAnswer: "C",
      explanation: "0.75 = 75/100 = 3/4.",
      difficulty: "MEDIUM" as const,
    },
    {
      topicId: fractionsTopic.id,
      questionText: "What is 2/5 of 20?",
      optionA: "4",
      optionB: "6",
      optionC: "8",
      optionD: "10",
      correctAnswer: "C",
      explanation: "20 ÷ 5 = 4, and 4 × 2 = 8.",
      difficulty: "MEDIUM" as const,
    },
    {
      topicId: geometryTopic.id,
      questionText: "How many sides does a triangle have?",
      optionA: "2",
      optionB: "3",
      optionC: "4",
      optionD: "5",
      correctAnswer: "B",
      explanation: "A triangle has three sides.",
      difficulty: "EASY" as const,
    },
    {
      topicId: geometryTopic.id,
      questionText: "How many degrees are in a right angle?",
      optionA: "45°",
      optionB: "60°",
      optionC: "90°",
      optionD: "180°",
      correctAnswer: "C",
      explanation: "A right angle measures exactly 90°.",
      difficulty: "EASY" as const,
    },
    {
      topicId: geometryTopic.id,
      questionText: "What is the perimeter of a square with a side of 6 cm?",
      optionA: "12 cm",
      optionB: "18 cm",
      optionC: "24 cm",
      optionD: "36 cm",
      correctAnswer: "C",
      explanation: "Perimeter = 4 × side = 4 × 6 = 24 cm.",
      difficulty: "MEDIUM" as const,
    },
    {
      topicId: geometryTopic.id,
      questionText: "What is the area of a rectangle with length 8 cm and width 5 cm?",
      optionA: "13 cm²",
      optionB: "26 cm²",
      optionC: "40 cm²",
      optionD: "80 cm²",
      correctAnswer: "C",
      explanation: "Area = length × width = 8 × 5 = 40 cm².",
      difficulty: "MEDIUM" as const,
    },
    {
      topicId: geometryTopic.id,
      questionText: "Which angle is less than 90°?",
      optionA: "Acute angle",
      optionB: "Right angle",
      optionC: "Obtuse angle",
      optionD: "Straight angle",
      correctAnswer: "A",
      explanation: "An acute angle is greater than 0° but less than 90°.",
      difficulty: "EASY" as const,
    },
    {
      topicId: algebraTopic.id,
      questionText: "If x + 5 = 12, what is x?",
      optionA: "5",
      optionB: "6",
      optionC: "7",
      optionD: "8",
      correctAnswer: "C",
      explanation: "Subtract 5 from both sides: x = 12 − 5 = 7.",
      difficulty: "EASY" as const,
    },
    {
      topicId: algebraTopic.id,
      questionText: "If 3x = 18, what is x?",
      optionA: "3",
      optionB: "6",
      optionC: "9",
      optionD: "12",
      correctAnswer: "B",
      explanation: "Divide both sides by 3: x = 18 ÷ 3 = 6.",
      difficulty: "EASY" as const,
    },
    {
      topicId: algebraTopic.id,
      questionText: "Simplify: 4x + 3x.",
      optionA: "7",
      optionB: "7x",
      optionC: "12x",
      optionD: "x⁷",
      correctAnswer: "B",
      explanation: "4x + 3x = 7x.",
      difficulty: "EASY" as const,
    },
    {
      topicId: algebraTopic.id,
      questionText: "If y = 5 and x = 3, what is x + y?",
      optionA: "2",
      optionB: "5",
      optionC: "8",
      optionD: "15",
      correctAnswer: "C",
      explanation: "x + y = 3 + 5 = 8.",
      difficulty: "EASY" as const,
    },
    {
      topicId: algebraTopic.id,
      questionText: "What is 2(5 + 3)?",
      optionA: "10",
      optionB: "13",
      optionC: "16",
      optionD: "18",
      correctAnswer: "C",
      explanation: "First calculate 5 + 3 = 8, then 2 × 8 = 16.",
      difficulty: "MEDIUM" as const,
    },
  ];

  for (const question of questions) {
    const existingQuestion = await prisma.question.findFirst({
      where: {
        subjectId: mathematicsId,
        questionText: question.questionText,
      },
    });

    if (existingQuestion) {
      await prisma.question.update({
        where: {
          id: existingQuestion.id,
        },
        data: {
          ...question,
          status: "PUBLISHED",
          subjectId: mathematicsId,
          marks: 1,
        },
      });
    } else {
      await prisma.question.create({
        data: {
          ...question,
          subjectId: mathematicsId,
          marks: 1,
          status: "PUBLISHED",
        },
      });
    }
  }

  console.log("✅ Mathematics question bank created.");

  console.log("");
  console.log("🎉 Student Prep database seed completed!");
  console.log("📦 Plans: 4");
  console.log("📚 Subjects: 5");
  console.log("📝 Mathematics Questions: 20");
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });