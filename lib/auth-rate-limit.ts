import { createHash } from 'node:crypto';
import { prisma } from './prisma';

// Atomic, database-backed limits survive restarts and multiple app instances.
export async function consumeAttempt(scope: string, limit: number): Promise<boolean> {
  const key = createHash('sha256').update(scope).digest('hex');
  const rows = await prisma.$queryRaw<{ attempts: number }[]>`
    INSERT INTO "AuthRateLimit" ("key", "attempts", "expiresAt")
    VALUES (${key}, 1, NOW() + INTERVAL '15 minutes')
    ON CONFLICT ("key") DO UPDATE SET
      "attempts" = CASE WHEN "AuthRateLimit"."expiresAt" <= NOW() THEN 1 ELSE "AuthRateLimit"."attempts" + 1 END,
      "expiresAt" = CASE WHEN "AuthRateLimit"."expiresAt" <= NOW() THEN NOW() + INTERVAL '15 minutes' ELSE "AuthRateLimit"."expiresAt" END
    RETURNING "attempts"`;
  return rows[0].attempts <= limit;
}
