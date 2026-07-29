-- AlterTable
ALTER TABLE "users"
RENAME COLUMN "last_bonus_claimed" TO "last_daily_bonus_claimed_on";

ALTER TABLE "users"
ALTER COLUMN "last_daily_bonus_claimed_on"
TYPE DATE
USING ("last_daily_bonus_claimed_on" AT TIME ZONE 'UTC')::DATE;

ALTER TABLE "users"
ADD COLUMN "daily_bonus_streak" INTEGER NOT NULL DEFAULT 0,
ADD CONSTRAINT "users_daily_bonus_streak_check"
CHECK ("daily_bonus_streak" >= 0);
