import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { unlink } from "fs/promises";
import path from "path";

interface DeleteImportRouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function DELETE(
  request: Request,
  context: DeleteImportRouteContext
) {
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

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        {
          message: "Import ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    const questionImport =
      await prisma.questionImport.findUnique({
        where: {
          id,
        },
        select: {
          id: true,
          fileName: true,
          filePath: true,
          totalItems: true,
        },
      });

    if (!questionImport) {
      return NextResponse.json(
        {
          message:
            "Question import record not found.",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * Delete the database record first.
     *
     * QuestionImportItem records are removed
     * automatically through the Prisma cascade
     * relation defined in the schema.
     */
    await prisma.questionImport.delete({
      where: {
        id,
      },
    });

    /*
     * Remove the uploaded physical file.
     *
     * The database deletion remains successful
     * even if the physical file has already been
     * removed.
     */
    if (questionImport.filePath) {
      const uploadDirectory = path.join(
        process.cwd(),
        "uploads",
        "question-imports"
      );

      const storedFileName = path.basename(
        questionImport.filePath
      );

      const physicalFilePath = path.join(
        uploadDirectory,
        storedFileName
      );

      try {
        await unlink(physicalFilePath);
      } catch (fileError) {
        const errorCode =
          fileError &&
          typeof fileError === "object" &&
          "code" in fileError
            ? fileError.code
            : null;

        if (errorCode !== "ENOENT") {
          console.error(
            "Question import file deletion error:",
            fileError
          );
        }
      }
    }

    return NextResponse.json(
      {
        message:
          "Question import deleted successfully.",
        deletedImport: {
          id: questionImport.id,
          fileName: questionImport.fileName,
          totalItems: questionImport.totalItems,
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Question import deletion error:",
      error
    );

    return NextResponse.json(
      {
        message:
          "An unexpected error occurred while deleting the question import.",
      },
      {
        status: 500,
      }
    );
  }
}