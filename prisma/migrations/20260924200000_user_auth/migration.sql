-- AlterTable
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "username" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "passwordHash" TEXT;

-- Backfill: temporary password "changeme123" (bcrypt)
UPDATE "User"
SET
  "username" = COALESCE(
    NULLIF(split_part(COALESCE("email", ''), '@', 1), ''),
    'user_' || substr("id", 1, 8)
  ),
  "passwordHash" = '$2b$10$3uBKZTCV0H5ZldygTQoahO612vBA3xJClYevFdhDiR1feQsxNQNkG'
WHERE "username" IS NULL OR "passwordHash" IS NULL;

-- Prefer demo credentials for the old seed email
UPDATE "User"
SET
  "username" = 'demo',
  "passwordHash" = '$2b$10$qNZ5Kd3J.gn3Zwf9bWy7uubF9o/pOy/P4w5ZIFQT5K9PKndeliVsC'
WHERE "email" = 'learner@local.dev';

-- Resolve username collisions
UPDATE "User" u
SET "username" = u."username" || '_' || substr(u."id", 1, 4)
WHERE EXISTS (
  SELECT 1 FROM "User" b
  WHERE b."username" = u."username" AND b."id" < u."id"
);

ALTER TABLE "User" ALTER COLUMN "username" SET NOT NULL;
ALTER TABLE "User" ALTER COLUMN "passwordHash" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "User_username_key" ON "User"("username");
