import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { readFile } from "fs/promises";
import path from "path";
import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";

interface ExtractRouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(
  request: Request,
  context: ExtractRouteContext
) {
  try {
    // ---------------------------------------------------------
    // Authentication
    // ---------------------------------------------------------

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

    // ---------------------------------------------------------
    // Admin authorization
    // ---------------------------------------------------------

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

    // ---------------------------------------------------------
    // Get import ID
    // ---------------------------------------------------------

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

    // ---------------------------------------------------------
    // Find import record
    // ---------------------------------------------------------

    const questionImport =
      await prisma.questionImport.findUnique({
        where: {
          id,
        },
      });

    if (!questionImport) {
      return NextResponse.json(
        {
          message: "Question import record not found.",
        },
        {
          status: 404,
        }
      );
    }

    // ---------------------------------------------------------
    // Validate stored file path
    // ---------------------------------------------------------

    if (!questionImport.filePath) {
      return NextResponse.json(
        {
          message:
            "No uploaded file is associated with this import.",
        },
        {
          status: 400,
        }
      );
    }

    // ---------------------------------------------------------
    // Prevent processing an already imported document
    // ---------------------------------------------------------

    if (questionImport.status === "IMPORTED") {
      return NextResponse.json(
        {
          message:
            "This question import has already been imported.",
        },
        {
          status: 409,
        }
      );
    }

    // ---------------------------------------------------------
    // Mark import as processing
    // ---------------------------------------------------------

    await prisma.questionImport.update({
      where: {
        id,
      },
      data: {
        status: "PROCESSING",
        errorMessage: null,
      },
    });

    try {
      // -------------------------------------------------------
      // Resolve file only inside the question-imports directory
      // -------------------------------------------------------

      const storedFileName = path.basename(
        questionImport.filePath
      );

      const uploadDirectory = path.join(
        process.cwd(),
        "uploads",
        "question-imports"
      );

      const filePath = path.join(
        uploadDirectory,
        storedFileName
      );

      // -------------------------------------------------------
      // Read uploaded file
      // -------------------------------------------------------

      const fileBuffer = await readFile(filePath);

      if (fileBuffer.length === 0) {
        throw new Error(
          "The uploaded file is empty."
        );
      }

      // -------------------------------------------------------
      // Extract text based on file type
      // -------------------------------------------------------

      let extractedText = "";

      const fileType =
        questionImport.fileType?.toLowerCase() ?? "";

      const extension = path
        .extname(questionImport.fileName)
        .toLowerCase();

      // -------------------------------------------------------
      // PDF
      // -------------------------------------------------------

      if (
        fileType === "application/pdf" ||
        extension === ".pdf"
      ) {
        const parser = new PDFParse({
          data: fileBuffer,
        });

        try {
          const result = await parser.getText();

          extractedText = result.text;
        } finally {
          await parser.destroy();
        }
      }

      // -------------------------------------------------------
      // DOCX
      // -------------------------------------------------------

      else if (
        fileType ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        extension === ".docx"
      ) {
        const result =
          await mammoth.extractRawText({
            buffer: fileBuffer,
          });

        extractedText = result.value;
      }

      // -------------------------------------------------------
      // TXT
      // -------------------------------------------------------

      else if (
        fileType === "text/plain" ||
        extension === ".txt"
      ) {
        extractedText = fileBuffer.toString(
          "utf-8"
        );
      }

      // -------------------------------------------------------
      // Unsupported type
      // -------------------------------------------------------

      else {
        throw new Error(
          "Unsupported document type."
        );
      }

      // -------------------------------------------------------
      // Clean extracted text
      // -------------------------------------------------------

      extractedText = extractedText
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n")
        .trim();

      if (!extractedText) {
        throw new Error(
          "No readable text could be extracted from the document."
        );
      }

      // -------------------------------------------------------
      // Save extracted text
      // -------------------------------------------------------

      const updatedImport =
        await prisma.questionImport.update({
          where: {
            id,
          },
          data: {
            extractedText,
            status: "READY_FOR_REVIEW",
            errorMessage: null,
          },
          select: {
            id: true,
            fileName: true,
            fileType: true,
            fileSize: true,
            status: true,
            totalItems: true,
            extractedText: true,
            updatedAt: true,
          },
        });

      // -------------------------------------------------------
      // Success
      // -------------------------------------------------------

      return NextResponse.json(
        {
          message:
            "Question document text extracted successfully.",
          import: {
            id: updatedImport.id,
            fileName: updatedImport.fileName,
            fileType: updatedImport.fileType,
            fileSize: updatedImport.fileSize,
            status: updatedImport.status,
            totalItems: updatedImport.totalItems,
            extractedTextLength:
              updatedImport.extractedText?.length ?? 0,
            updatedAt: updatedImport.updatedAt,
          },
        },
        {
          status: 200,
        }
      );
    } catch (extractionError) {
      console.error(
        "Question document extraction error:",
        extractionError
      );

      const errorMessage =
        extractionError instanceof Error
          ? extractionError.message
          : "Failed to extract text from the document.";

      await prisma.questionImport.update({
        where: {
          id,
        },
        data: {
          status: "FAILED",
          errorMessage,
        },
      });

      return NextResponse.json(
        {
          message:
            "The question document could not be processed.",
          error: errorMessage,
        },
        {
          status: 422,
        }
      );
    }
  } catch (error) {
    console.error(
      "Question import extraction route error:",
      error
    );

    return NextResponse.json(
      {
        message:
          "An unexpected error occurred while processing the question document.",
      },
      {
        status: 500,
      }
    );
  }
}