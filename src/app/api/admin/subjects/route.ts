import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const createSubjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Subject name must be at least 2 characters.")
    .max(100, "Subject name must not exceed 100 characters."),
  description: z
    .string()
    .trim()
    .max(500, "Description must not exceed 500 characters.")
    .optional()
    .or(z.literal("")),
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

    const parsed = createSubjectSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Invalid subject data.",
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const name = parsed.data.name;
    const description = parsed.data.description || null;

    const existingSubject = await prisma.subject.findUnique({
      where: {
        name,
      },
    });

    if (existingSubject) {
      return NextResponse.json(
        {
          message: "A subject with this name already exists.",
        },
        { status: 409 }
      );
    }

    const subject = await prisma.subject.create({
      data: {
        name,
        description,
        isActive: true,
      },
    });

    return NextResponse.json(
      {
        message: "Subject created successfully.",
        subject: {
          id: subject.id,
          name: subject.name,
          description: subject.description,
          isActive: subject.isActive,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create subject error:", error);

    return NextResponse.json(
      {
        message: "An unexpected error occurred.",
      },
      { status: 500 }
    );
  }
}