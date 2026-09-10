ALTER TABLE "StudySession"
ADD COLUMN "reportData" JSONB,
ADD COLUMN "reportPath" TEXT,
ADD COLUMN "reportGeneratedAt" TIMESTAMP(3),
ADD COLUMN "reportModel" TEXT,
ADD COLUMN "reportReasoning" TEXT,
ADD COLUMN "reportPromptVersion" TEXT,
ADD COLUMN "processingAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "processingNextAttemptAt" TIMESTAMP(3),
ADD COLUMN "processingToken" TEXT;
