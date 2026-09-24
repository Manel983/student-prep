import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { readFile } from "fs/promises";
import path from "path";
import * as XLSX from "xlsx";

interface ParseExcelRouteContext {
  params: Promise<{
    id: string;
  }>;
}

const CLASS_LEVELS = new Set([
  "PRIMARY_1",
  "PRIMARY_2",
  "PRIMARY_3",
  "PRIMARY_4",
  "PRIMARY_5",
  "PRIMARY_6",
  "JHS_1",
  "JHS_2",
  "JHS_3",
]);

const EXAM_TYPES = new Set([
  "BECE",
  "LIKELY",
  "TOPIC_BASED",
]);

const REQUIRED_COLUMNS = [
  "subject",
  "class",
  "topic",
  "exam type",
  "question",
  "option a",
  "option b",
  "option c",
  "option d",
  "correct answer",
  "explanation",
];

function normalizeHeader(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function normalizeValue(value: unknown) {
  return String(value ?? "").trim();
}

function normalizeEnumValue(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
}

function normalizeCorrectAnswer(value: string) {
  const normalized = value.trim().toUpperCase();

  if (
    normalized === "A" ||
    normalized === "B" ||
    normalized === "C" ||
    normalized === "D"
  ) {
    return normalized;
  }

  if (normalized.startsWith("A.")) return "A";
  if (normalized.startsWith("B.")) return "B";
  if (normalized.startsWith("C.")) return "C";
  if (normalized.startsWith("D.")) return "D";

  return null;
}

export async function POST(
  request: Request,
  context: ParseExcelRouteContext
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

    if (
      path.extname(questionImport.fileName).toLowerCase() !==
      ".xlsx"
    ) {
      return NextResponse.json(
        {
          message:
            "This parser only accepts Excel (.xlsx) files.",
        },
        {
          status: 400,
        }
      );
    }

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

    await prisma.questionImport.update({
      where: {
        id,
      },
      data: {
        status: "PROCESSING",
        errorMessage: null,
        totalItems: 0,
      },
    });

    try {
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

      const fileBuffer = await readFile(filePath);

      if (fileBuffer.length === 0) {
        throw new Error(
          "The uploaded Excel file is empty."
        );
      }

      const workbook = XLSX.read(fileBuffer, {
        type: "buffer",
      });

      if (workbook.SheetNames.length === 0) {
        throw new Error(
          "The Excel workbook does not contain any worksheets."
        );
      }

      const firstSheetName = workbook.SheetNames[0];

      if (!firstSheetName) {
        throw new Error(
          "The Excel workbook does not contain a usable worksheet."
        );
      }

      const worksheet =
        workbook.Sheets[firstSheetName];

      if (!worksheet) {
        throw new Error(
          "The first worksheet could not be read."
        );
      }

      const rawRows =
        XLSX.utils.sheet_to_json<Record<string, unknown>>(
          worksheet,
          {
            defval: "",
            raw: false,
          }
        );

      if (rawRows.length === 0) {
        throw new Error(
          "The Excel worksheet does not contain any question rows."
        );
      }

      const firstRow = rawRows[0];

      if (!firstRow) {
        throw new Error(
          "The Excel worksheet does not contain a valid header row."
        );
      }

      const headerMap = new Map<string, string>();

      for (const key of Object.keys(firstRow)) {
        headerMap.set(
          normalizeHeader(key),
          key
        );
      }

      const missingColumns =
        REQUIRED_COLUMNS.filter(
          (column) => !headerMap.has(column)
        );

      if (missingColumns.length > 0) {
        throw new Error(
          `Missing required Excel columns: ${missingColumns.join(
            ", "
          )}`
        );
      }

      const getCell = (
        row: Record<string, unknown>,
        column: string
      ) => {
        const actualHeader =
          headerMap.get(column);

        if (!actualHeader) {
          return "";
        }

        return normalizeValue(
          row[actualHeader]
        );
      };

      const subjects =
        await prisma.subject.findMany({
          select: {
            id: true,
            name: true,
          },
        });

      const subjectMap = new Map(
        subjects.map((subject) => [
          subject.name.trim().toLowerCase(),
          subject,
        ])
      );

      const topics =
        await prisma.topic.findMany({
          select: {
            id: true,
            subjectId: true,
            name: true,
          },
        });

      const topicMap = new Map(
        topics.map((topic) => [
          `${topic.subjectId}:${topic.name
            .trim()
            .toLowerCase()}`,
          topic,
        ])
      );

      /*
       * Create missing topics automatically.
       *
       * Topics are created under the matching subject.
       * This allows a bulk question bank to introduce
       * new topics without requiring the administrator
       * to create every topic manually first.
       */
      const ensureTopic = async (
        subjectId: string,
        topicName: string
      ) => {
        const normalizedTopicName =
          topicName.trim().toLowerCase();

        const topicKey =
          `${subjectId}:${normalizedTopicName}`;

        const existingTopic =
          topicMap.get(topicKey);

        if (existingTopic) {
          return existingTopic;
        }

        const createdTopic =
          await prisma.topic.upsert({
            where: {
              subjectId_name: {
                subjectId,
                name: topicName.trim(),
              },
            },
            update: {},
            create: {
              subjectId,
              name: topicName.trim(),
            },
          });

        topicMap.set(
          topicKey,
          createdTopic
        );

        return createdTopic;
      };

      const validItems: Array<{
        importId: string;
        questionText: string;
        optionA: string;
        optionB: string;
        optionC: string;
        optionD: string;
        correctAnswer: string;
        explanation: string | null;
        suggestedClassLevel:
          | "PRIMARY_1"
          | "PRIMARY_2"
          | "PRIMARY_3"
          | "PRIMARY_4"
          | "PRIMARY_5"
          | "PRIMARY_6"
          | "JHS_1"
          | "JHS_2"
          | "JHS_3";
        suggestedExamType:
          | "BECE"
          | "LIKELY"
          | "TOPIC_BASED";
        suggestedBeceYear: number | null;
        suggestedTopicId: string;
      }> = [];

      const errors: Array<{
        row: number;
        errors: string[];
      }> = [];

      for (
        let index = 0;
        index < rawRows.length;
        index++
      ) {
        const row = rawRows[index];

        if (!row) {
          continue;
        }

        const excelRowNumber = index + 2;

        const subjectName = getCell(
          row,
          "subject"
        );

        const classValue = normalizeEnumValue(
          getCell(row, "class")
        );

        const topicName = getCell(
          row,
          "topic"
        );

        const examTypeValue =
          normalizeEnumValue(
            getCell(row, "exam type")
          );

        const beceYearValue = getCell(
          row,
          "bece year"
        );

        const questionText = getCell(
          row,
          "question"
        );

        const optionA = getCell(
          row,
          "option a"
        );

        const optionB = getCell(
          row,
          "option b"
        );

        const optionC = getCell(
          row,
          "option c"
        );

        const optionD = getCell(
          row,
          "option d"
        );

        const correctAnswer =
          normalizeCorrectAnswer(
            getCell(row, "correct answer")
          );

        const explanation =
          getCell(row, "explanation");

        const rowErrors: string[] = [];

        if (!subjectName) {
          rowErrors.push(
            "Subject is required."
          );
        }

        if (!classValue) {
          rowErrors.push(
            "Class is required."
          );
        } else if (
          !CLASS_LEVELS.has(classValue)
        ) {
          rowErrors.push(
            `Invalid class "${classValue}".`
          );
        }

        if (!topicName) {
          rowErrors.push(
            "Topic is required."
          );
        }

        if (!examTypeValue) {
          rowErrors.push(
            "Exam Type is required."
          );
        } else if (
          !EXAM_TYPES.has(examTypeValue)
        ) {
          rowErrors.push(
            `Invalid exam type "${examTypeValue}".`
          );
        }

        if (!questionText) {
          rowErrors.push(
            "Question is required."
          );
        }

        if (!optionA) {
          rowErrors.push(
            "Option A is required."
          );
        }

        if (!optionB) {
          rowErrors.push(
            "Option B is required."
          );
        }

        if (!optionC) {
          rowErrors.push(
            "Option C is required."
          );
        }

        if (!optionD) {
          rowErrors.push(
            "Option D is required."
          );
        }

        if (!correctAnswer) {
          rowErrors.push(
            "Correct Answer must be A, B, C, or D."
          );
        }

        if (
          examTypeValue === "BECE" &&
          !beceYearValue
        ) {
          rowErrors.push(
            "BECE Year is required for BECE questions."
          );
        }

        if (
          examTypeValue &&
          examTypeValue !== "BECE" &&
          beceYearValue
        ) {
          rowErrors.push(
            "BECE Year must be empty for non-BECE questions."
          );
        }

        const subject =
          subjectMap.get(
            subjectName.toLowerCase()
          );

        if (
          subjectName &&
          !subject
        ) {
          rowErrors.push(
            `Subject "${subjectName}" was not found in the system.`
          );
        }

        let topic:
          | {
              id: string;
              subjectId: string;
              name: string;
            }
          | undefined;

        /*
         * Missing topics are NOT rejected.
         * They are automatically created after
         * the subject has been validated.
         */
        if (
          subject &&
          topicName
        ) {
          topic = await ensureTopic(
            subject.id,
            topicName
          );
        }

        let beceYear: number | null = null;

        if (beceYearValue) {
          const parsedYear =
            Number(beceYearValue);

          if (
            !Number.isInteger(parsedYear) ||
            parsedYear < 2000 ||
            parsedYear > 2100
          ) {
            rowErrors.push(
              `Invalid BECE Year "${beceYearValue}".`
            );
          } else {
            beceYear = parsedYear;
          }
        }

        if (
          !topic &&
          !rowErrors.some((error) =>
            error.startsWith("Topic")
          )
        ) {
          rowErrors.push(
            "A valid topic could not be assigned."
          );
        }

        if (rowErrors.length > 0) {
          errors.push({
            row: excelRowNumber,
            errors: rowErrors,
          });

          continue;
        }

        validItems.push({
          importId: questionImport.id,
          questionText,
          optionA,
          optionB,
          optionC,
          optionD,
          correctAnswer: correctAnswer!,
          explanation: explanation || null,
          suggestedClassLevel:
            classValue as
              | "PRIMARY_1"
              | "PRIMARY_2"
              | "PRIMARY_3"
              | "PRIMARY_4"
              | "PRIMARY_5"
              | "PRIMARY_6"
              | "JHS_1"
              | "JHS_2"
              | "JHS_3",
          suggestedExamType:
            examTypeValue as
              | "BECE"
              | "LIKELY"
              | "TOPIC_BASED",
          suggestedBeceYear: beceYear,
          suggestedTopicId: topic!.id,
        });
      }

      if (validItems.length === 0) {
        const summary =
          errors
            .slice(0, 10)
            .map(
              (item) =>
                `Row ${item.row}: ${item.errors.join(
                  " "
                )}`
            )
            .join(" ");

        throw new Error(
          `No valid question rows were found. ${summary}`
        );
      }

      await prisma.questionImportItem.deleteMany({
        where: {
          importId: questionImport.id,
        },
      });

      await prisma.questionImportItem.createMany({
        data: validItems,
      });

      const updatedImport =
        await prisma.questionImport.update({
          where: {
            id: questionImport.id,
          },
          data: {
            status: "READY_FOR_REVIEW",
            totalItems: validItems.length,
            errorMessage:
              errors.length > 0
                ? `${errors.length} row(s) were rejected during validation.`
                : null,
          },
          select: {
            id: true,
            fileName: true,
            fileType: true,
            fileSize: true,
            status: true,
            totalItems: true,
            errorMessage: true,
            updatedAt: true,
          },
        });

      return NextResponse.json(
        {
          message:
            "Excel question bank parsed successfully.",
          import: updatedImport,
          statistics: {
            totalRows: rawRows.length,
            validRows: validItems.length,
            rejectedRows: errors.length,
          },
          errors: errors.slice(0, 100),
        },
        {
          status: 200,
        }
      );
    } catch (parseError) {
      console.error(
        "Excel question parsing error:",
        parseError
      );

      const errorMessage =
        parseError instanceof Error
          ? parseError.message
          : "Failed to parse the Excel question bank.";

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
            "The Excel question bank could not be processed.",
          error: errorMessage,
        },
        {
          status: 422,
        }
      );
    }
  } catch (error) {
    console.error(
      "Excel question import route error:",
      error
    );

    return NextResponse.json(
      {
        message:
          "An unexpected error occurred while parsing the Excel question bank.",
      },
      {
        status: 500,
      }
    );
  }
}