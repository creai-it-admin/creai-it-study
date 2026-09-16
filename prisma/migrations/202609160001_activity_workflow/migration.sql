ALTER TABLE "StudySession" ADD COLUMN "activityStatus" TEXT NOT NULL DEFAULT 'locked';
ALTER TABLE "FormField" ADD COLUMN "stage" TEXT NOT NULL DEFAULT 'before';
UPDATE "FormField" SET "stage" = 'after' WHERE "question" LIKE '[피드백 후]%';
ALTER TABLE "Submission" ADD COLUMN "firstSharedAt" TIMESTAMP(3), ADD COLUMN "completedAt" TIMESTAMP(3), ADD COLUMN "firstSnapshot" JSONB, ADD COLUMN "firstResult" TEXT NOT NULL DEFAULT '', ADD COLUMN "revisedResult" TEXT NOT NULL DEFAULT '';
CREATE TABLE "ActivityFeedback" (
 "id" TEXT NOT NULL PRIMARY KEY, "submissionId" TEXT NOT NULL REFERENCES "Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE,
 "authorId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
 "text" TEXT NOT NULL, "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE UNIQUE INDEX "ActivityFeedback_submissionId_authorId_key" ON "ActivityFeedback"("submissionId", "authorId");
CREATE INDEX "ActivityFeedback_authorId_idx" ON "ActivityFeedback"("authorId");
ALTER TABLE "ActivityFeedback" ENABLE ROW LEVEL SECURITY;
