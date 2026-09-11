CREATE TYPE "MaterialKind" AS ENUM ('education', 'presentation');
CREATE TABLE "SessionMaterial" (
  "id" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "kind" "MaterialKind" NOT NULL,
  "title" TEXT NOT NULL,
  "path" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SessionMaterial_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "SessionMaterial_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "StudySession"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "SessionMaterial_path_key" ON "SessionMaterial"("path");
CREATE INDEX "SessionMaterial_sessionId_kind_idx" ON "SessionMaterial"("sessionId", "kind");
-- Keep the legacy column for rolling deployment and preserve existing education slides.
INSERT INTO "SessionMaterial" ("id", "sessionId", "kind", "title", "path", "updatedAt")
SELECT 'education-' || "id", "id", 'education', '교육 장표', "deckPath", CURRENT_TIMESTAMP
FROM "StudySession" WHERE "deckPath" IS NOT NULL;
ALTER TABLE "SessionMaterial" ENABLE ROW LEVEL SECURITY;
