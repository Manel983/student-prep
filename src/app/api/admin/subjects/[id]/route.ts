import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const updateSubjectSchema = z.object({
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
  isActive: z.boolean(),
});

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function PATCH(
  request: Request,
  { params }: RouteContext
) {
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

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { message: "Subject ID is required." },
        { status: 400 }
      );
    }

    const body = await request.json();

    const parsed = updateSubjectSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Invalid subject data.",
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const existingSubject = await prisma.subject.findUnique({
      where: {
        id,
      },
    });

    if (!existingSubject) {
      return NextResponse.json(
        { message: "Subject not found." },
        { status: 404 }
      );
    }

    const duplicateSubject = await prisma.subject.findFirst({
      where: {
        name: parsed.data.name,
        NOT: {
          id,
        },
      },
    });

    if (duplicateSubject) {
      return NextResponse.json(
        {
          message: "A subject with this name already exists.",
        },
        { status: 409 }
      );
    }

    const subject = await prisma.subject.update({
      where: {
        id,
      },
      data: {
        name: parsed.data.name,
        description: parsed.data.description || null,
        isActive: parsed.data.isActive,
      },
    });

    return NextResponse.json({
      message: "Subject updated successfully.",
      subject: {
        id: subject.id,
        name: subject.name,
        description: subject.description,
        isActive: subject.isActive,
      },
    });
  } catch (error) {
    console.error("Update subject error:", error);

    return NextResponse.json(
      {
        message: "An unexpected error occurred.",
      },
      { status: 500 }
    );
  }
}