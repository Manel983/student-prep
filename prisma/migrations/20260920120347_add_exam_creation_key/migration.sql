/*
  Warnings:

  - A unique constraint covering the columns `[creationKey]` on the table `Exam` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Exam" ADD COLUMN     "creationKey" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Exam_creationKey_key" ON "Exam"("creationKey");
