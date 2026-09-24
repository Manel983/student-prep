/*
  Warnings:

  - You are about to drop the column `creationKey` on the `Exam` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[examCreationKey]` on the table `Exam` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "QuestionImportStatus" AS ENUM ('UPLOADED', 'PROCESSING', 'READY_FOR_REVIEW', 'IMPORTED', 'FAILED');

-- CreateEnum
CREATE TYPE "QuestionImportItemStatus" AS ENUM ('PENDING', 'REVIEWED', 'IMPORTED', 'REJECTED');

-- DropIndex
DROP INDEX "Exam_creationKey_key";

-- AlterTable
ALTER TABLE "Exam" DROP COLUMN "creationKey",
ADD COLUMN     "examCreationKey" TEXT;

-- CreateTable
CREATE TABLE "QuestionImport" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "status" "QuestionImportStatus" NOT NULL DEFAULT 'UPLOADED',
    "errorMessage" TEXT,
    "totalItems" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuestionImport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionImportItem" (
    "id" TEXT NOT NULL,
    "importId" TEXT NOT NULL,
    "questionText" TEXT NOT NULL,
    "optionA" TEXT NOT NULL,
    "optionB" TEXT NOT NULL,
    "optionC" TEXT NOT NULL,
    "optionD" TEXT NOT NULL,
    "correctAnswer" TEXT,
    "explanation" TEXT,
    "suggestedClassLevel" "ClassLevel",
    "suggestedExamType" "ExamType",
    "suggestedBeceYear" INTEGER,
    "suggestedTopicId" TEXT,
    "status" "QuestionImportItemStatus" NOT NULL DEFAULT 'PENDING',
    "reviewNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuestionImportItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "QuestionImport_status_idx" ON "QuestionImport"("status");

-- CreateIndex
CREATE INDEX "QuestionImport_createdAt_idx" ON "QuestionImport"("createdAt");

-- CreateIndex
CREATE INDEX "QuestionImportItem_importId_idx" ON "QuestionImportItem"("importId");

-- CreateIndex
CREATE INDEX "QuestionImportItem_status_idx" ON "QuestionImportItem"("status");

-- CreateIndex
CREATE INDEX "QuestionImportItem_suggestedClassLevel_idx" ON "QuestionImportItem"("suggestedClassLevel");

-- CreateIndex
CREATE INDEX "QuestionImportItem_suggestedExamType_idx" ON "QuestionImportItem"("suggestedExamType");

-- CreateIndex
CREATE INDEX "QuestionImportItem_suggestedBeceYear_idx" ON "QuestionImportItem"("suggestedBeceYear");

-- CreateIndex
CREATE UNIQUE INDEX "Exam_examCreationKey_key" ON "Exam"("examCreationKey");

-- AddForeignKey
ALTER TABLE "QuestionImportItem" ADD CONSTRAINT "QuestionImportItem_importId_fkey" FOREIGN KEY ("importId") REFERENCES "QuestionImport"("id") ON DELETE CASCADE ON UPDATE CASCADE;
