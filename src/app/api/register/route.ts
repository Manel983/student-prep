import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const registerSchema = z
  .object({
    firstName: z
      .string()
      .trim()
      .min(2, "First name must be at least 2 characters.")
      .max(50, "First name is too long."),

    lastName: z
      .string()
      .trim()
      .min(2, "Last name must be at least 2 characters.")
      .max(50, "Last name is too long."),

    email: z
      .string()
      .trim()
      .email("Please enter a valid email address.")
      .max(100, "Email address is too long."),

    password: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .max(100, "Password is too long."),

    confirmPassword: z
      .string()
      .min(1, "Please confirm your password."),

    classLevel: z.enum(
      [
        "PRIMARY_1",
        "PRIMARY_2",
        "PRIMARY_3",
        "PRIMARY_4",
        "PRIMARY_5",
        "PRIMARY_6",
        "JHS_1",
        "JHS_2",
        "JHS_3",
      ],
      {
        message: "Please select a valid class.",
      }
    ),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const validation = registerSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Please correct the errors in the form.",
          errors: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const {
      firstName,
      lastName,
      email,
      password,
      classLevel,
    } = validation.data;

    const normalizedEmail = email.toLowerCase();

    const existingUser = await prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: "An account with this email already exists.",
        },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const freePlan = await prisma.plan.findUnique({
      where: {
        type: "FREE",
      },
    });

    if (!freePlan) {
      return NextResponse.json(
        {
          success: false,
          message:
            "The Free subscription plan has not been configured. Please contact the administrator.",
        },
        { status: 500 }
      );
    }

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          firstName,
          lastName,
          email: normalizedEmail,
          passwordHash,
          role: "STUDENT",
          isActive: true,

          profile: {
            create: {
              classLevel,
            },
          },

          subscriptions: {
            create: {
              planId: freePlan.id,
              status: "ACTIVE",
              startedAt: new Date(),
              expiresAt: null,
              testsUsed: 0,
              freeTestsUsed: 0,
              paymentRequired: false,
            },
          },
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      });

      return newUser;
    });

    return NextResponse.json(
      {
        success: true,
        message: "Account created successfully.",
        user,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong while creating your account.",
      },
      { status: 500 }
    );
  }
}