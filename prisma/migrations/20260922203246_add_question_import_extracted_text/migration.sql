-- DropIndex
DROP INDEX "QuestionImportItem_suggestedExamType_idx";

-- AlterTable
ALTER TABLE "QuestionImport" ADD COLUMN     "extractedText" TEXT;
