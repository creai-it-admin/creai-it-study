ALTER TABLE "LibraryAsset" ADD COLUMN "cohortNo" INTEGER NOT NULL DEFAULT 1
  CHECK ("cohortNo" >= 0);
