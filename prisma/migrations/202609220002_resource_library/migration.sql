CREATE TABLE "LibraryAsset" (
 "id" TEXT NOT NULL PRIMARY KEY, "title" TEXT NOT NULL,
 "weekNo" INTEGER NOT NULL CHECK ("weekNo" BETWEEN 0 AND 4),
 "versionCount" INTEGER NOT NULL DEFAULT 0,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "LibraryAsset_weekNo_createdAt_idx" ON "LibraryAsset"("weekNo", "createdAt");
CREATE TABLE "LibraryVersion" (
 "id" TEXT NOT NULL PRIMARY KEY, "assetId" TEXT NOT NULL,
 "number" INTEGER NOT NULL, "path" TEXT NOT NULL, "note" TEXT NOT NULL DEFAULT '',
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "LibraryVersion_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "LibraryAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "LibraryVersion_path_key" ON "LibraryVersion"("path");
CREATE UNIQUE INDEX "LibraryVersion_assetId_number_key" ON "LibraryVersion"("assetId", "number");
ALTER TABLE "Study" ADD COLUMN "otSourceVersionId" TEXT;
ALTER TABLE "Study" ADD CONSTRAINT "Study_otSourceVersionId_fkey" FOREIGN KEY ("otSourceVersionId") REFERENCES "LibraryVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SessionMaterial" ADD COLUMN "sourceVersionId" TEXT;
ALTER TABLE "SessionMaterial" ADD CONSTRAINT "SessionMaterial_sourceVersionId_fkey" FOREIGN KEY ("sourceVersionId") REFERENCES "LibraryVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "LibraryAsset" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LibraryVersion" ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
 IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN REVOKE ALL ON "LibraryAsset", "LibraryVersion" FROM anon; END IF;
 IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN REVOKE ALL ON "LibraryAsset", "LibraryVersion" FROM authenticated; END IF;
END $$;
