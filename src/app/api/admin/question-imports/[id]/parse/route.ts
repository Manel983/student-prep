import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { readFile } from "fs/promises";
import path from "path";
import mammoth from "mammoth";

interface ParseRouteContext {
  params: Promise<{
    id: string;
  }>;
}

interface ParsedQuestion {
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
}

const QUESTION_START_WORDS =
  "Identify|What|Which|How|Skip|Complete|Count|Find|Use|Compare|Write|Look|Shade|Draw|Name";

const QUESTION_START_REGEX = new RegExp(
  `\\b(?:${QUESTION_START_WORDS})\\b`,
  "i"
);

function cleanText(value: string): string {
  return value
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function removeQuestionNumber(
  value: string
): string {
  return value
    .replace(
      /^\s*(?:question\s*)?\d+\s*[.)-]\s*/i,
      ""
    )
    .trim();
}

function normalizeOptionMarkers(
  value: string
): string {
  let text = value;

  /*
   * Fix flattened Word text such as:
   *
   * SquareB. RectangleC. Circle
   *
   * into:
   *
   * Square B. Rectangle C. Circle
   */
  text = text.replace(
    /([^\s])([A-D])([.)-])/g,
    "$1 $2$3"
  );

  /*
   * Normalize A), A-, A. into A.
   */
  text = text.replace(
    /(^|\s)([A-D])([.)-])\s*/g,
    "$1$2. "
  );

  return cleanText(text);
}

function extractParagraphsFromHtml(
  html: string
): string[] {
  const paragraphs: string[] = [];

  const matches = html.matchAll(
    /<p[^>]*>([\s\S]*?)<\/p>/gi
  );

  for (const match of matches) {
    const paragraph =
      match[1]
        .replace(
          /<br\s*\/?>/gi,
          "\n"
        )
        .replace(
          /<[^>]+>/g,
          " "
        )
        .replace(
          /&nbsp;/gi,
          " "
        )
        .replace(
          /&amp;/gi,
          "&"
        )
        .replace(
          /&lt;/gi,
          "<"
        )
        .replace(
          /&gt;/gi,
          ">"
        )
        .trim();

    if (paragraph) {
      paragraphs.push(paragraph);
    }
  }

  return paragraphs;
}

function removeDocumentHeader(
  text: string
): string {
  return text
    .replace(
      /^GRENEHYLL SCHOOL\b/i,
      ""
    )
    .replace(
      /END OF TERM ASSESSEMENT\s*\(JULY,\s*2026\)/i,
      ""
    )
    .replace(
      /SUBJECT:\s*MATHEMATICS/i,
      ""
    )
    .replace(
      /CLASS:\s*YEAR\s*3/i,
      ""
    )
    .replace(
      /DURATION:\s*60\s*MINUTES/i,
      ""
    )
    .replace(
      /NAME:\s*.*?(?=SECTION A)/i,
      ""
    )
    .replace(
      /SECTION A\s*\(OBJECTIVES\)\s*40\s*MARKS/i,
      ""
    )
    .replace(
      /CHOOSE THE CORRECT ANSWER\.?/i,
      ""
    )
    .trim();
}

/*
 * Locate all question starts in the document.
 *
 * We deliberately require a question-start word to be
 * followed somewhere shortly afterward by an A. option.
 *
 * This prevents "What" inside an answer or explanation
 * from being treated as a new question.
 */
function findQuestionStarts(
  text: string
): number[] {
  const positions: number[] = [];

  const regex = new RegExp(
    `\\b(?:${QUESTION_START_WORDS})\\b`,
    "gi"
  );

  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const position = match.index;

    const preview =
      text.slice(
        position,
        Math.min(
          position + 500,
          text.length
        )
      );

    /*
     * A valid question should eventually
     * contain an A option.
     */
    if (
      /\bA\.\s*/i.test(
        preview
      )
    ) {
      positions.push(position);
    }
  }

  return positions;
}

/*
 * Extract options from a question segment.
 */
function parseQuestionSegment(
  segment: string
): ParsedQuestion | null {
  const text =
    normalizeOptionMarkers(
      segment
    );

  const optionA =
    text.search(
      /\bA\.\s*/i
    );

  const optionB =
    text.search(
      /\bB\.\s*/i
    );

  const optionC =
    text.search(
      /\bC\.\s*/i
    );

  const optionD =
    text.search(
      /\bD\.\s*/i
    );

  if (
    optionA === -1 ||
    optionB === -1 ||
    optionC === -1
  ) {
    return null;
  }

  /*
   * Options must appear in order.
   */
  if (
    optionB < optionA ||
    optionC < optionB ||
    (optionD !== -1 &&
      optionD < optionC)
  ) {
    return null;
  }

  const questionText =
    removeQuestionNumber(
      cleanText(
        text.slice(
          0,
          optionA
        )
      )
    );

  const optionAText =
    cleanText(
      text.slice(
        optionA + 2,
        optionB
      )
    );

  const optionBText =
    cleanText(
      text.slice(
        optionB + 2,
        optionC
      )
    );

  const optionCEnd =
    optionD !== -1
      ? optionD
      : text.length;

  const optionCText =
    cleanText(
      text.slice(
        optionC + 2,
        optionCEnd
      )
    );

  const optionDText =
    optionD !== -1
      ? cleanText(
          text.slice(
            optionD + 2
          )
        )
      : "";

  /*
   * Reject clearly malformed records.
   */
  if (
    !questionText ||
    !optionAText ||
    !optionBText ||
    !optionCText
  ) {
    return null;
  }

  /*
   * Prevent obvious accidental merging
   * of another question into option C/D.
   */
  if (
    QUESTION_START_REGEX.test(
      optionCText
    ) &&
    optionCText.length > 80
  ) {
    return null;
  }

  return {
    questionText,
    optionA: optionAText,
    optionB: optionBText,
    optionC: optionCText,
    optionD: optionDText,
  };
}

function parseQuestions(
  sourceText: string
): ParsedQuestion[] {
  let text = normalizeOptionMarkers(
    sourceText
  );

  /*
   * Ignore everything from Section B
   * onward because Section B contains
   * written-response questions rather
   * than standard MCQs.
   */
  const sectionBIndex =
    text.search(
      /\bSECTION\s+B\b/i
    );

  if (sectionBIndex !== -1) {
    text = text.slice(
      0,
      sectionBIndex
    );
  }

  text =
    removeDocumentHeader(
      text
    );

  text = normalizeOptionMarkers(
    text
  );

  const questionStarts =
    findQuestionStarts(
      text
    );

  const questions: ParsedQuestion[] =
    [];

  for (
    let index = 0;
    index < questionStarts.length;
    index++
  ) {
    const start =
      questionStarts[index];

    const end =
      index + 1 <
      questionStarts.length
        ? questionStarts[
            index + 1
          ]
        : text.length;

    let segment =
      text.slice(
        start,
        end
      );

    segment = cleanText(
      segment
    );

    /*
     * Sometimes a previous option C ends
     * immediately before the next question.
     * Trim anything after a new question
     * marker accidentally captured.
     */
    const parsed =
      parseQuestionSegment(
        segment
      );

    if (parsed) {
      questions.push(
        parsed
      );
    }
  }

  return questions;
}

export async function POST(
  request: Request,
  context: ParseRouteContext
) {
  try {
    const session =
      await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          message:
            "Unauthorized.",
        },
        {
          status: 401,
        }
      );
    }

    const admin =
      await prisma.user.findUnique(
        {
          where: {
            id: session.user.id,
          },
          select: {
            role: true,
            isActive: true,
          },
        }
      );

    if (
      !admin ||
      !admin.isActive ||
      admin.role !== "ADMIN"
    ) {
      return NextResponse.json(
        {
          message:
            "Forbidden.",
        },
        {
          status: 403,
        }
      );
    }

    const { id } =
      await context.params;

    if (!id) {
      return NextResponse.json(
        {
          message:
            "Import ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    const questionImport =
      await prisma.questionImport.findUnique(
        {
          where: {
            id,
          },
        }
      );

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
      questionImport.status ===
      "IMPORTED"
    ) {
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

    const storedFileName =
      path.basename(
        questionImport.filePath
      );

    const uploadDirectory =
      path.join(
        process.cwd(),
        "uploads",
        "question-imports"
      );

    const filePath =
      path.join(
        uploadDirectory,
        storedFileName
      );

    const fileBuffer =
      await readFile(
        filePath
      );

    if (!fileBuffer.length) {
      return NextResponse.json(
        {
          message:
            "The uploaded file is empty.",
        },
        {
          status: 422,
        }
      );
    }

    const extension =
      path.extname(
        questionImport.fileName
      ).toLowerCase();

    let sourceText = "";

    if (
      extension === ".docx"
    ) {
      const result =
        await mammoth.convertToHtml(
          {
            buffer:
              fileBuffer,
          }
        );

      const paragraphs =
        extractParagraphsFromHtml(
          result.value
        );

      sourceText =
        paragraphs.join(
          " "
        );
    } else if (
      extension === ".txt"
    ) {
      sourceText =
        fileBuffer.toString(
          "utf-8"
        );
    } else {
      sourceText =
        questionImport.extractedText ??
        "";
    }

    sourceText =
      cleanText(
        sourceText
      );

    if (!sourceText) {
      return NextResponse.json(
        {
          message:
            "No readable text was found in the document.",
        },
        {
          status: 422,
        }
      );
    }

    const parsedQuestions =
      parseQuestions(
        sourceText
      );

    if (
      parsedQuestions.length === 0
    ) {
      await prisma.questionImport.update(
        {
          where: {
            id,
          },
          data: {
            status:
              "FAILED",
            errorMessage:
              "No complete multiple-choice questions could be detected.",
            totalItems: 0,
          },
        }
      );

      return NextResponse.json(
        {
          message:
            "No complete multiple-choice questions could be detected in the document.",
          totalItems: 0,
        },
        {
          status: 422,
        }
      );
    }

    /*
     * Remove previous parser output.
     */
    await prisma.questionImportItem.deleteMany(
      {
        where: {
          importId:
            questionImport.id,
        },
      }
    );

    /*
     * Save the newly detected questions.
     */
    await prisma.questionImportItem.createMany(
      {
        data:
          parsedQuestions.map(
            (
              question
            ) => ({
              importId:
                questionImport.id,

              questionText:
                question.questionText,

              optionA:
                question.optionA,

              optionB:
                question.optionB,

              optionC:
                question.optionC,

              optionD:
                question.optionD,

              status:
                "PENDING",
            })
          ),
      }
    );

    const updatedImport =
      await prisma.questionImport.update(
        {
          where: {
            id:
              questionImport.id,
          },
          data: {
            status:
              "READY_FOR_REVIEW",

            totalItems:
              parsedQuestions.length,

            errorMessage:
              null,
          },
          select: {
            id: true,
            fileName: true,
            status: true,
            totalItems: true,
            updatedAt: true,
          },
        }
      );

    return NextResponse.json(
      {
        message:
          "Questions detected and prepared for review.",

        import:
          updatedImport,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Question import parsing error:",
      error
    );

    return NextResponse.json(
      {
        message:
          "An unexpected error occurred while parsing the question document.",
      },
      {
        status: 500,
      }
    );
  }
}