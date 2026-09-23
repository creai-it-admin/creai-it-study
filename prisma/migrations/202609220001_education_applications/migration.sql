CREATE TABLE "EducationApplication" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "birthDate" DATE NOT NULL,
  "phone" TEXT NOT NULL,
  "referral" TEXT NOT NULL,
  "availableFrom" DATE NOT NULL,
  "timeBlocks" TEXT[] NOT NULL,
  "consentedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EducationApplication_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "EducationApplication_createdAt_id_idx" ON "EducationApplication"("createdAt", "id");
CREATE INDEX "EducationApplication_availableFrom_idx" ON "EducationApplication"("availableFrom");
-- Only the trusted Prisma connection can access application PII.
ALTER TABLE "EducationApplication" ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON "EducationApplication" FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON "EducationApplication" FROM authenticated;
  END IF;
END $$;
