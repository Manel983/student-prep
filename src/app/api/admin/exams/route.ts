import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const VALID_STATUSES = [
  "NOT_STARTED",
  "IN_PROGRESS",
  "SUBMITTED",
  "AUTO_SUBMITTED",
  "MARKED",
] as const;

export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          message: "Unauthorized.",
        },
        {
          status: 401,
        }
      );
    }

    const admin = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        role: true,
        isActive: true,
      },
    });

    if (
      !admin ||
      !admin.isActive ||
      admin.role !== "ADMIN"
    ) {
      return NextResponse.json(
        {
          message: "Forbidden.",
        },
        {
          status: 403,
        }
      );
    }

    const { searchParams } =
      new URL(request.url);

    const search =
      searchParams.get("search")?.trim() || "";

    const subjectId =
      searchParams.get("subjectId") || "";

    const status =
      searchParams.get("status") || "";

    const requestedPage = Number(
      searchParams.get("page") || "1"
    );

    const requestedPageSize = Number(
      searchParams.get("pageSize") || "25"
    );

    const page =
      Number.isInteger(requestedPage) &&
      requestedPage > 0
        ? requestedPage
        : 1;

    const pageSize =
      Number.isInteger(requestedPageSize) &&
      requestedPageSize > 0 &&
      requestedPageSize <= 100
        ? requestedPageSize
        : 25;

    const validStatus = VALID_STATUSES.includes(
      status as (typeof VALID_STATUSES)[number]
    )
      ? status
      : "";

    const where = {
      ...(search
        ? {
            OR: [
              {
                title: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
              {
                user: {
                  email: {
                    contains: search,
                    mode: "insensitive" as const,
                  },
                },
              },
              {
                user: {
                  firstName: {
                    contains: search,
                    mode: "insensitive" as const,
                  },
                },
              },
              {
                user: {
                  lastName: {
                    contains: search,
                    mode: "insensitive" as const,
                  },
                },
              },
            ],
          }
        : {}),

      ...(subjectId
        ? {
            subjectId,
          }
        : {}),

      ...(validStatus
        ? {
            status: validStatus as
              | "NOT_STARTED"
              | "IN_PROGRESS"
              | "SUBMITTED"
              | "AUTO_SUBMITTED"
              | "MARKED",
          }
        : {}),
    };

    const [total, exams] =
      await Promise.all([
        prisma.exam.count({
          where,
        }),

        prisma.exam.findMany({
          where,

          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },

            subject: {
              select: {
                id: true,
                name: true,
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
                timeUsedSeconds: true,
                completedAt: true,
              },
            },
          },

          orderBy: {
            createdAt: "desc",
          },

          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
      ]);

    const totalPages = Math.max(
      1,
      Math.ceil(total / pageSize)
    );

    return NextResponse.json({
      exams,
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
      filters: {
        search,
        subjectId,
        status: validStatus,
      },
    });
  } catch (error) {
    console.error(
      "Admin exams API error:",
      error
    );

    return NextResponse.json(
      {
        message:
          "An unexpected error occurred while loading exams.",
      },
      {
        status: 500,
      }
    );
  }
}