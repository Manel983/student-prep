import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_FILE_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "application/octet-stream",
]);

const ALLOWED_EXTENSIONS = new Set([
  ".pdf",
  ".docx",
  ".xlsx",
  ".txt",
]);

export async function POST(request: Request) {
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

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          message: "Please select a file to upload.",
        },
        {
          status: 400,
        }
      );
    }

    if (file.size <= 0) {
      return NextResponse.json(
        {
          message: "The uploaded file is empty.",
        },
        {
          status: 400,
        }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          message:
            "File size must not exceed 10 MB.",
        },
        {
          status: 400,
        }
      );
    }

    const originalFileName = file.name.trim();

    if (!originalFileName) {
      return NextResponse.json(
        {
          message:
            "The uploaded file must have a filename.",
        },
        {
          status: 400,
        }
      );
    }

    const extension = path
      .extname(originalFileName)
      .toLowerCase();

    if (!ALLOWED_EXTENSIONS.has(extension)) {
      return NextResponse.json(
        {
          message:
            "Unsupported file type. Please upload a PDF, DOCX, XLSX, or TXT file.",
        },
        {
          status: 400,
        }
      );
    }

    const fileType =
      file.type || "application/octet-stream";

    /*
     * Some browsers may report .xlsx files using
     * application/octet-stream. The extension check
     * above ensures that only supported extensions
     * are accepted.
     */
    if (
      !ALLOWED_FILE_TYPES.has(fileType) &&
      extension !== ".xlsx"
    ) {
      return NextResponse.json(
        {
          message:
            "The uploaded file type is not supported.",
        },
        {
          status: 400,
        }
      );
    }

    const uniqueName = `${crypto.randomUUID()}${extension}`;

    const uploadDirectory = path.join(
      process.cwd(),
      "uploads",
      "question-imports"
    );

    const filePath = path.join(
      uploadDirectory,
      uniqueName
    );

    const fileBuffer = Buffer.from(
      await file.arrayBuffer()
    );

    await writeFile(
      filePath,
      fileBuffer
    );

    const questionImport =
      await prisma.questionImport.create({
        data: {
          fileName: originalFileName,
          filePath: path.join(
            "uploads",
            "question-imports",
            uniqueName
          ),
          fileType,
          fileSize: file.size,
          status: "UPLOADED",
          totalItems: 0,
        },
      });

    return NextResponse.json(
      {
        message:
          "Question document uploaded successfully.",
        import: {
          id: questionImport.id,
          fileName:
            questionImport.fileName,
          fileType:
            questionImport.fileType,
          fileSize:
            questionImport.fileSize,
          status:
            questionImport.status,
        },
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Question import upload error:",
      error
    );

    return NextResponse.json(
      {
        message:
          "An unexpected error occurred while uploading the question document.",
      },
      {
        status: 500,
      }
    );
  }
}