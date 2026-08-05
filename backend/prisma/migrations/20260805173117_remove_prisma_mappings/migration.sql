-- Rename existing tables and columns to Prisma's default model and field names.
-- These operations preserve the existing rows and relationships.

-- RenameTable
ALTER TABLE "users" RENAME TO "User";
ALTER TABLE "cards" RENAME TO "Card";
ALTER TABLE "active_blackjack_games" RENAME TO "ActiveBlackjackGame";
ALTER TABLE "active_hands" RENAME TO "ActiveHand";
ALTER TABLE "active_hand_cards" RENAME TO "ActiveHandCard";
ALTER TABLE "active_mines_games" RENAME TO "ActiveMinesGame";
ALTER TABLE "active_cells" RENAME TO "ActiveCell";
ALTER TABLE "game_results" RENAME TO "GameResult";

-- RenameColumn: User
ALTER TABLE "User" RENAME COLUMN "daily_bonus_streak" TO "dailyBonusStreak";
ALTER TABLE "User" RENAME COLUMN "last_daily_bonus_claimed_on" TO "lastDailyBonusClaimedOn";

-- RenameColumn: ActiveBlackjackGame
ALTER TABLE "ActiveBlackjackGame" RENAME COLUMN "is_game_over" TO "isGameOver";
ALTER TABLE "ActiveBlackjackGame" RENAME COLUMN "user_id" TO "userId";
ALTER TABLE "ActiveBlackjackGame" RENAME COLUMN "start_bet" TO "startBet";
ALTER TABLE "ActiveBlackjackGame" RENAME COLUMN "total_wagered" TO "totalWagered";
ALTER TABLE "ActiveBlackjackGame" RENAME COLUMN "offer_insurance" TO "offerInsurance";

-- RenameColumn: ActiveHand
ALTER TABLE "ActiveHand" RENAME COLUMN "game_id" TO "gameId";
ALTER TABLE "ActiveHand" RENAME COLUMN "is_player" TO "isPlayer";
ALTER TABLE "ActiveHand" RENAME COLUMN "is_selected" TO "isSelected";
ALTER TABLE "ActiveHand" RENAME COLUMN "is_completed" TO "isCompleted";
ALTER TABLE "ActiveHand" RENAME COLUMN "is_bust" TO "isBust";

-- RenameColumn: ActiveHandCard
ALTER TABLE "ActiveHandCard" RENAME COLUMN "hand_id" TO "handId";
ALTER TABLE "ActiveHandCard" RENAME COLUMN "card_id" TO "cardId";

-- RenameColumn: ActiveMinesGame
ALTER TABLE "ActiveMinesGame" RENAME COLUMN "user_id" TO "userId";

-- RenameColumn: ActiveCell
ALTER TABLE "ActiveCell" RENAME COLUMN "game_id" TO "gameId";
ALTER TABLE "ActiveCell" RENAME COLUMN "is_gem" TO "isGem";
ALTER TABLE "ActiveCell" RENAME COLUMN "is_revealed" TO "isRevealed";

-- RenameColumn: GameResult
ALTER TABLE "GameResult" RENAME COLUMN "user_id" TO "userId";
ALTER TABLE "GameResult" RENAME COLUMN "game_type" TO "gameType";
ALTER TABLE "GameResult" RENAME COLUMN "completed_at" TO "completedAt";

-- RenameSequence
ALTER SEQUENCE "users_id_seq" RENAME TO "User_id_seq";
ALTER SEQUENCE "active_blackjack_games_id_seq" RENAME TO "ActiveBlackjackGame_id_seq";
ALTER SEQUENCE "active_hands_id_seq" RENAME TO "ActiveHand_id_seq";
ALTER SEQUENCE "active_mines_games_id_seq" RENAME TO "ActiveMinesGame_id_seq";
ALTER SEQUENCE "game_results_id_seq" RENAME TO "GameResult_id_seq";

-- RenamePrimaryKey
ALTER TABLE "User" RENAME CONSTRAINT "users_pkey" TO "User_pkey";
ALTER TABLE "Card" RENAME CONSTRAINT "cards_pkey" TO "Card_pkey";
ALTER TABLE "ActiveBlackjackGame" RENAME CONSTRAINT "active_blackjack_games_pkey" TO "ActiveBlackjackGame_pkey";
ALTER TABLE "ActiveHand" RENAME CONSTRAINT "active_hands_pkey" TO "ActiveHand_pkey";
ALTER TABLE "ActiveHandCard" RENAME CONSTRAINT "active_hand_cards_pkey" TO "ActiveHandCard_pkey";
ALTER TABLE "ActiveMinesGame" RENAME CONSTRAINT "active_mines_games_pkey" TO "ActiveMinesGame_pkey";
ALTER TABLE "ActiveCell" RENAME CONSTRAINT "active_cells_pkey" TO "ActiveCell_pkey";
ALTER TABLE "GameResult" RENAME CONSTRAINT "game_results_pkey" TO "GameResult_pkey";

-- RenameForeignKey
ALTER TABLE "ActiveBlackjackGame" RENAME CONSTRAINT "active_blackjack_games_user_id_fkey" TO "ActiveBlackjackGame_userId_fkey";
ALTER TABLE "ActiveHand" RENAME CONSTRAINT "active_hands_game_id_fkey" TO "ActiveHand_gameId_fkey";
ALTER TABLE "ActiveHandCard" RENAME CONSTRAINT "active_hand_cards_hand_id_fkey" TO "ActiveHandCard_handId_fkey";
ALTER TABLE "ActiveHandCard" RENAME CONSTRAINT "active_hand_cards_card_id_fkey" TO "ActiveHandCard_cardId_fkey";
ALTER TABLE "ActiveMinesGame" RENAME CONSTRAINT "active_mines_games_user_id_fkey" TO "ActiveMinesGame_userId_fkey";
ALTER TABLE "ActiveCell" RENAME CONSTRAINT "active_cells_game_id_fkey" TO "ActiveCell_gameId_fkey";
ALTER TABLE "GameResult" RENAME CONSTRAINT "game_results_user_id_fkey" TO "GameResult_userId_fkey";

-- RenameCheckConstraint
ALTER TABLE "User" RENAME CONSTRAINT "users_balance_check" TO "User_balance_check";
ALTER TABLE "User" RENAME CONSTRAINT "users_daily_bonus_streak_check" TO "User_dailyBonusStreak_check";
ALTER TABLE "Card" RENAME CONSTRAINT "cards_id_check" TO "Card_id_check";
ALTER TABLE "Card" RENAME CONSTRAINT "cards_rank_check" TO "Card_rank_check";
ALTER TABLE "Card" RENAME CONSTRAINT "cards_suit_check" TO "Card_suit_check";
ALTER TABLE "Card" RENAME CONSTRAINT "cards_value_check" TO "Card_value_check";
ALTER TABLE "ActiveBlackjackGame" RENAME CONSTRAINT "active_blackjack_games_start_bet_check" TO "ActiveBlackjackGame_startBet_check";
ALTER TABLE "ActiveHand" RENAME CONSTRAINT "active_hands_bet_check" TO "ActiveHand_bet_check";
ALTER TABLE "ActiveHandCard" RENAME CONSTRAINT "active_hand_cards_sequence_check" TO "ActiveHandCard_sequence_check";
ALTER TABLE "ActiveMinesGame" RENAME CONSTRAINT "active_mines_games_bet_check" TO "ActiveMinesGame_bet_check";
ALTER TABLE "ActiveMinesGame" RENAME CONSTRAINT "active_mines_games_multiplier_check" TO "ActiveMinesGame_multiplier_check";
ALTER TABLE "ActiveCell" RENAME CONSTRAINT "active_cells_field_check" TO "ActiveCell_field_check";
ALTER TABLE "GameResult" RENAME CONSTRAINT "game_results_wagered_check" TO "GameResult_wagered_check";
ALTER TABLE "GameResult" RENAME CONSTRAINT "game_results_payout_check" TO "GameResult_payout_check";

-- RenameIndex
ALTER INDEX "users_email_key" RENAME TO "User_email_key";
ALTER INDEX "users_username_lower_key" RENAME TO "User_username_lower_key";
ALTER INDEX "users_email_lower_key" RENAME TO "User_email_lower_key";
ALTER INDEX "cards_rank_suit_key" RENAME TO "Card_rank_suit_key";
ALTER INDEX "active_blackjack_games_user_id_key" RENAME TO "ActiveBlackjackGame_userId_key";
ALTER INDEX "active_hands_game_id_idx" RENAME TO "ActiveHand_gameId_idx";
ALTER INDEX "active_hand_cards_card_id_idx" RENAME TO "ActiveHandCard_cardId_idx";
ALTER INDEX "active_mines_games_user_id_key" RENAME TO "ActiveMinesGame_userId_key";
ALTER INDEX "game_results_user_id_completed_at_id_idx" RENAME TO "GameResult_userId_completedAt_id_idx";
ALTER INDEX "game_results_user_id_game_type_completed_at_id_idx" RENAME TO "GameResult_userId_gameType_completedAt_id_idx";

-- CreateTable
CREATE TABLE "Role" (
    "id" SERIAL NOT NULL,
    "key" VARCHAR(100) NOT NULL,
    "displayName" VARCHAR(100) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" SERIAL NOT NULL,
    "key" VARCHAR(100) NOT NULL,
    "displayName" VARCHAR(100) NOT NULL,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_RoleToUser" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_RoleToUser_AB_pkey" PRIMARY KEY ("A", "B")
);

-- CreateTable
CREATE TABLE "_PermissionToRole" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_PermissionToRole_AB_pkey" PRIMARY KEY ("A", "B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Role_key_key" ON "Role"("key");
CREATE UNIQUE INDEX "Permission_key_key" ON "Permission"("key");
CREATE INDEX "_RoleToUser_B_index" ON "_RoleToUser"("B");
CREATE INDEX "_PermissionToRole_B_index" ON "_PermissionToRole"("B");

-- AddForeignKey
ALTER TABLE "_RoleToUser" ADD CONSTRAINT "_RoleToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_RoleToUser" ADD CONSTRAINT "_RoleToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_PermissionToRole" ADD CONSTRAINT "_PermissionToRole_A_fkey" FOREIGN KEY ("A") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_PermissionToRole" ADD CONSTRAINT "_PermissionToRole_B_fkey" FOREIGN KEY ("B") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;
