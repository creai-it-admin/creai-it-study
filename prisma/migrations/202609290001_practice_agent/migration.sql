ALTER TABLE "FormDef" ADD COLUMN "agentMd" TEXT NOT NULL DEFAULT '', ADD COLUMN "agentWebSearch" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "StudySession" ADD COLUMN "commentary" JSONB, ADD COLUMN "spotlight" JSONB;
CREATE TABLE "PracticeEvent" (
 "id" TEXT NOT NULL PRIMARY KEY,
 "sessionId" TEXT NOT NULL REFERENCES "StudySession"("id") ON DELETE CASCADE ON UPDATE CASCADE,
 "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
 "seq" INTEGER NOT NULL,
 "kind" TEXT NOT NULL,
 "text" TEXT NOT NULL,
 "meta" JSONB,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "PracticeEvent_sessionId_userId_seq_key" ON "PracticeEvent"("sessionId", "userId", "seq");
CREATE INDEX "PracticeEvent_userId_idx" ON "PracticeEvent"("userId");
CREATE TABLE "PracticeSummary" (
 "sessionId" TEXT NOT NULL REFERENCES "StudySession"("id") ON DELETE CASCADE ON UPDATE CASCADE,
 "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
 "throughSeq" INTEGER NOT NULL,
 "data" JSONB NOT NULL,
 "model" TEXT NOT NULL,
 "reasoning" TEXT NOT NULL,
 "promptVersion" TEXT NOT NULL,
 "generatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "PracticeSummary_pkey" PRIMARY KEY ("sessionId", "userId")
);
CREATE INDEX "PracticeSummary_userId_idx" ON "PracticeSummary"("userId");
ALTER TABLE "PracticeEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PracticeSummary" ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
 IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN REVOKE ALL ON "PracticeEvent", "PracticeSummary" FROM anon; END IF;
 IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN REVOKE ALL ON "PracticeEvent", "PracticeSummary" FROM authenticated; END IF;
END $$;
