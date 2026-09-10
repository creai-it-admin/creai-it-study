-- Additive: preserve existing users, OAuth records, and study data.
ALTER TABLE "User" ADD COLUMN "passwordHash" TEXT,
                   ADD COLUMN "authVersion" INTEGER NOT NULL DEFAULT 0;
-- Prevent case variants from registering a second account for an existing email.
CREATE UNIQUE INDEX "User_email_lower_key" ON "User" (lower("email"));
CREATE TABLE "AuthRateLimit" (
  "key" TEXT PRIMARY KEY,
  "attempts" INTEGER NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL
);
