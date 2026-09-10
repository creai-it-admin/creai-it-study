BEGIN;
ALTER TABLE "StudySession"
 ADD COLUMN "deckPath" TEXT,
 ADD COLUMN "startedAt" TIMESTAMP(3),
 ADD COLUMN "endedAt" TIMESTAMP(3),
 ADD COLUMN "recordingState" TEXT NOT NULL DEFAULT 'idle',
 ADD COLUMN "recorderKey" TEXT,
 ADD COLUMN "recorderUserId" TEXT,
 ADD COLUMN "processingState" TEXT NOT NULL DEFAULT 'pending',
 ADD COLUMN "processingLeaseUntil" TIMESTAMP(3),
 ADD COLUMN "processingError" TEXT,
 ADD COLUMN "summary" TEXT;
CREATE TABLE "RecordingPart" (
 "id" TEXT PRIMARY KEY,
 "sessionId" TEXT NOT NULL REFERENCES "StudySession"("id") ON DELETE CASCADE,
 "path" TEXT NOT NULL UNIQUE,
 "mimeType" TEXT NOT NULL,
 "bytes" INTEGER NOT NULL,
 "recordedAt" TIMESTAMP(3) NOT NULL,
 "durationMs" INTEGER NOT NULL,
 "uploadedAt" TIMESTAMP(3),
 "transcript" TEXT
);
CREATE INDEX "RecordingPart_sessionId_recordedAt_idx" ON "RecordingPart"("sessionId", "recordedAt");
ALTER TABLE "RecordingPart" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "StudySession" ENABLE ROW LEVEL SECURITY;
-- Preserve legacy data; derive session boundaries only from recorded segment timestamps.
UPDATE "StudySession" s SET "startedAt" = x.started, "endedAt" = CASE WHEN s.status = 'closed' THEN x.ended END
FROM (SELECT "sessionId", min("startedAt") AS started, max("endedAt") AS ended FROM "Segment" GROUP BY "sessionId") x
WHERE s.id = x."sessionId";
COMMIT;
