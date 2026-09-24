import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
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

    const imports =
      await prisma.questionImport.findMany({
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          fileName: true,
          filePath: true,
          fileType: true,
          fileSize: true,
          status: true,
          errorMessage: true,
          totalItems: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              items: true,
            },
          },
        },
      });

    return NextResponse.json({
      imports: imports.map((questionImport) => ({
        id: questionImport.id,
        fileName: questionImport.fileName,
        fileType: questionImport.fileType,
        fileSize: questionImport.fileSize,
        status: questionImport.status,
        errorMessage: questionImport.errorMessage,
        totalItems: questionImport.totalItems,
        itemCount: questionImport._count.items,
        createdAt: questionImport.createdAt,
        updatedAt: questionImport.updatedAt,
      })),
    });
  } catch (error) {
    console.error(
      "Question import list error:",
      error
    );

    return NextResponse.json(
      {
        message:
          "Failed to retrieve question imports.",
      },
      {
        status: 500,
      }
    );
  }
}