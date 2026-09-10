BEGIN;
CREATE TABLE "Study" (
 "id" TEXT NOT NULL PRIMARY KEY,
 "name" TEXT NOT NULL,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "Study" (id,name) VALUES ('study-zero','0기 스터디');
ALTER TABLE "StudySession" ADD COLUMN "studyId" TEXT;
UPDATE "StudySession" SET "studyId"='study-zero';
ALTER TABLE "StudySession" ALTER COLUMN "studyId" SET NOT NULL;
ALTER TABLE "StudySession" ADD CONSTRAINT "StudySession_studyId_fkey" FOREIGN KEY ("studyId") REFERENCES "Study"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE UNIQUE INDEX "StudySession_studyId_weekNo_key" ON "StudySession"("studyId","weekNo");
ALTER TABLE "Study" ENABLE ROW LEVEL SECURITY;
COMMIT;
