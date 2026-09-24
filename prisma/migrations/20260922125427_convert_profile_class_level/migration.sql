/*
  Safe migration for:
  - Profile.classLevel: String? -> ClassLevel?
  - Question.classLevel: required ClassLevel
  - Question.examType: required ExamType
  - Question.beceYear: optional Int
*/

-- ---------------------------------------------------------
-- Create enums
-- ---------------------------------------------------------

CREATE TYPE "ClassLevel" AS ENUM (
  'PRIMARY_1',
  'PRIMARY_2',
  'PRIMARY_3',
  'PRIMARY_4',
  'PRIMARY_5',
  'PRIMARY_6',
  'JHS_1',
  'JHS_2',
  'JHS_3'
);

CREATE TYPE "ExamType" AS ENUM (
  'BECE',
  'LIKELY',
  'TOPIC_BASED'
);

-- ---------------------------------------------------------
-- Convert Profile.classLevel safely
-- ---------------------------------------------------------

ALTER TABLE "Profile"
ADD COLUMN "classLevel_new" "ClassLevel";

UPDATE "Profile"
SET "classLevel_new" = CASE
  WHEN "classLevel" = 'PRIMARY_1' THEN 'PRIMARY_1'::"ClassLevel"
  WHEN "classLevel" = 'PRIMARY_2' THEN 'PRIMARY_2'::"ClassLevel"
  WHEN "classLevel" = 'PRIMARY_3' THEN 'PRIMARY_3'::"ClassLevel"
  WHEN "classLevel" = 'PRIMARY_4' THEN 'PRIMARY_4'::"ClassLevel"
  WHEN "classLevel" = 'PRIMARY_5' THEN 'PRIMARY_5'::"ClassLevel"
  WHEN "classLevel" = 'PRIMARY_6' THEN 'PRIMARY_6'::"ClassLevel"
  WHEN "classLevel" = 'JHS_1' THEN 'JHS_1'::"ClassLevel"
  WHEN "classLevel" = 'JHS_2' THEN 'JHS_2'::"ClassLevel"
  WHEN "classLevel" = 'JHS_3' THEN 'JHS_3'::"ClassLevel"
  ELSE NULL
END;

ALTER TABLE "Profile"
DROP COLUMN "classLevel";

ALTER TABLE "Profile"
RENAME COLUMN "classLevel_new" TO "classLevel";

-- ---------------------------------------------------------
-- Add Question metadata as nullable first
-- ---------------------------------------------------------

ALTER TABLE "Question"
ADD COLUMN "beceYear" INTEGER,
ADD COLUMN "classLevel" "ClassLevel",
ADD COLUMN "examType" "ExamType";

-- ---------------------------------------------------------
-- Backfill existing questions
--
-- Existing questions are currently the seeded JHS 1
-- likely-examination questions.
-- ---------------------------------------------------------

UPDATE "Question"
SET
  "classLevel" = 'JHS_1'::"ClassLevel",
  "examType" = 'LIKELY'::"ExamType"
WHERE "classLevel" IS NULL
   OR "examType" IS NULL;

-- ---------------------------------------------------------
-- Make Question.classLevel and examType required
-- ---------------------------------------------------------

ALTER TABLE "Question"
ALTER COLUMN "classLevel" SET NOT NULL,
ALTER COLUMN "examType" SET NOT NULL;

-- ---------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------

CREATE INDEX "Question_classLevel_idx"
ON "Question"("classLevel");

CREATE INDEX "Question_examType_idx"
ON "Question"("examType");

CREATE INDEX "Question_beceYear_idx"
ON "Question"("beceYear");

CREATE INDEX "Question_subjectId_classLevel_examType_beceYear_idx"
ON "Question"("subjectId", "classLevel", "examType", "beceYear");