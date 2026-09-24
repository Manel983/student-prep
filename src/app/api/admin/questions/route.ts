import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const createQuestionSchema = z
  .object({
    subjectId: z
      .string()
      .trim()
      .min(1, "Subject is required."),

    topicId: z
      .string()
      .trim()
      .optional()
      .or(z.literal("")),

    questionText: z
      .string()
      .trim()
      .min(1, "Question text is required.")
      .max(5000, "Question text is too long."),

    optionA: z
      .string()
      .trim()
      .min(1, "Option A is required.")
      .max(2000, "Option A is too long."),

    optionB: z
      .string()
      .trim()
      .min(1, "Option B is required.")
      .max(2000, "Option B is too long."),

    optionC: z
      .string()
      .trim()
      .min(1, "Option C is required.")
      .max(2000, "Option C is too long."),

    optionD: z
      .string()
      .trim()
      .min(1, "Option D is required.")
      .max(2000, "Option D is too long."),

    correctAnswer: z.enum(["A", "B", "C", "D"]),

    explanation: z
      .string()
      .trim()
      .max(5000, "Explanation is too long.")
      .optional()
      .or(z.literal("")),

    difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),

    marks: z
      .number()
      .int("Marks must be a whole number.")
      .min(1, "Marks must be at least 1.")
      .max(100, "Marks must not exceed 100."),

    status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),

    classLevel: z.enum([
      "PRIMARY_1",
      "PRIMARY_2",
      "PRIMARY_3",
      "PRIMARY_4",
      "PRIMARY_5",
      "PRIMARY_6",
      "JHS_1",
      "JHS_2",
      "JHS_3",
    ]),

    examType: z.enum([
      "BECE",
      "LIKELY",
      "TOPIC_BASED",
    ]),

    beceYear: z
      .number()
      .int("BECE year must be a whole number.")
      .min(2000, "Invalid BECE year.")
      .max(new Date().getFullYear(), "Invalid BECE year.")
      .optional()
      .nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.examType === "BECE" && !data.beceYear) {
      ctx.addIssue({
        code: "custom",
        path: ["beceYear"],
        message: "BECE year is required for BECE questions.",
      });
    }

    if (data.examType !== "BECE" && data.beceYear) {
      ctx.addIssue({
        code: "custom",
        path: ["beceYear"],
        message:
          "BECE year should only be provided for BECE questions.",
      });
    }
  });

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized." },
        { status: 401 }
      );
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Forbidden." },
        { status: 403 }
      );
    }

    const body = await request.json();

    const parsed = createQuestionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Invalid question data.",
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const {
      subjectId,
      topicId,
      questionText,
      optionA,
      optionB,
      optionC,
      optionD,
      correctAnswer,
      explanation,
      difficulty,
      marks,
      status,
      classLevel,
      examType,
      beceYear,
    } = parsed.data;

    const subject = await prisma.subject.findUnique({
      where: {
        id: subjectId,
      },
    });

    if (!subject) {
      return NextResponse.json(
        { message: "Subject not found." },
        { status: 404 }
      );
    }

    if (!subject.isActive) {
      return NextResponse.json(
        {
          message:
            "Questions cannot be added to an inactive subject.",
        },
        { status: 400 }
      );
    }

    if (topicId) {
      const topic = await prisma.topic.findFirst({
        where: {
          id: topicId,
          subjectId,
        },
      });

      if (!topic) {
        return NextResponse.json(
          {
            message:
              "The selected topic does not belong to the selected subject.",
          },
          { status: 400 }
        );
      }
    }

    const question = await prisma.question.create({
      data: {
        subjectId,
        topicId: topicId || null,
        questionText,
        optionA,
        optionB,
        optionC,
        optionD,
        correctAnswer,
        explanation: explanation || null,
        difficulty,
        marks,
        status,
        classLevel,
        examType,
        beceYear:
          examType === "BECE"
            ? beceYear ?? null
            : null,
      },
      include: {
        subject: {
          select: {
            id: true,
            name: true,
          },
        },
        topic: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        message: "Question created successfully.",
        question: {
          id: question.id,
          subjectId: question.subjectId,
          subjectName: question.subject.name,
          topicId: question.topicId,
          topicName: question.topic?.name || null,
          questionText: question.questionText,
          classLevel: question.classLevel,
          examType: question.examType,
          beceYear: question.beceYear,
          difficulty: question.difficulty,
          marks: question.marks,
          status: question.status,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create question error:", error);

    return NextResponse.json(
      {
        message: "An unexpected error occurred.",
      },
      { status: 500 }
    );
  }
}