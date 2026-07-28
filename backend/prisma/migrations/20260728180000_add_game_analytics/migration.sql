-- CreateEnum
CREATE TYPE "GameType" AS ENUM ('BLACKJACK', 'MINES', 'ROULETTE');

-- AlterTable
ALTER TABLE "active_blackjack_games"
ADD COLUMN "total_wagered" DECIMAL(14,2);

-- Existing active games may already have been split or doubled. Player-hand
-- bets are the closest durable representation of their total wager.
UPDATE "active_blackjack_games" AS game
SET "total_wagered" = COALESCE(
    (
        SELECT SUM(hand."bet")
        FROM "active_hands" AS hand
        WHERE hand."game_id" = game."id"
          AND hand."is_player" = true
    ),
    game."start_bet"
);

ALTER TABLE "active_blackjack_games"
ALTER COLUMN "total_wagered" SET NOT NULL;

-- CreateTable
CREATE TABLE "game_results" (
    "id" BIGSERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "game_type" "GameType" NOT NULL,
    "wagered" DECIMAL(14,2) NOT NULL,
    "payout" DECIMAL(14,2) NOT NULL,
    "completed_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "game_results_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "game_results_wagered_check" CHECK ("wagered" > 0),
    CONSTRAINT "game_results_payout_check" CHECK ("payout" >= 0)
);

-- CreateIndex
CREATE INDEX "game_results_user_id_completed_at_id_idx"
ON "game_results"("user_id", "completed_at", "id");

-- CreateIndex
CREATE INDEX "game_results_user_id_game_type_completed_at_id_idx"
ON "game_results"("user_id", "game_type", "completed_at", "id");

-- AddForeignKey
ALTER TABLE "game_results"
ADD CONSTRAINT "game_results_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
