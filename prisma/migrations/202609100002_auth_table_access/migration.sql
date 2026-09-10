-- Auth data is accessed only by trusted server-side Prisma connections.
-- Supabase's public API must not expose password hashes, reset tokens or rate limits.
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "VerificationToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuthRateLimit" ENABLE ROW LEVEL SECURITY;
