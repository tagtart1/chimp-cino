-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password" TEXT NOT NULL,
    "balance" DECIMAL(14,2) NOT NULL DEFAULT 10000.00,
    "last_bonus_claimed" TIMESTAMPTZ(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "users_balance_check" CHECK ("balance" >= 0)
);

-- CreateTable
CREATE TABLE "cards" (
    "id" INTEGER NOT NULL,
    "rank" VARCHAR(2) NOT NULL,
    "suit" CHAR(1) NOT NULL,
    "value" INTEGER NOT NULL,

    CONSTRAINT "cards_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "cards_id_check" CHECK ("id" BETWEEN 1 AND 52),
    CONSTRAINT "cards_rank_check" CHECK ("rank" IN ('A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K')),
    CONSTRAINT "cards_suit_check" CHECK ("suit" IN ('C', 'D', 'H', 'S')),
    CONSTRAINT "cards_value_check" CHECK ("value" BETWEEN 2 AND 11)
);

-- CreateTable
CREATE TABLE "active_blackjack_games" (
    "id" SERIAL NOT NULL,
    "is_game_over" BOOLEAN NOT NULL DEFAULT false,
    "user_id" INTEGER NOT NULL,
    "start_bet" DECIMAL(14,2) NOT NULL,
    "offer_insurance" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "active_blackjack_games_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "active_blackjack_games_start_bet_check" CHECK ("start_bet" > 0)
);

-- CreateTable
CREATE TABLE "active_hands" (
    "id" SERIAL NOT NULL,
    "game_id" INTEGER NOT NULL,
    "is_player" BOOLEAN NOT NULL,
    "is_selected" BOOLEAN NOT NULL DEFAULT true,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "is_bust" BOOLEAN NOT NULL DEFAULT false,
    "bet" DECIMAL(14,2) NOT NULL DEFAULT 0.00,

    CONSTRAINT "active_hands_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "active_hands_bet_check" CHECK ("bet" >= 0)
);

-- CreateTable
CREATE TABLE "active_hand_cards" (
    "hand_id" INTEGER NOT NULL,
    "card_id" INTEGER NOT NULL,
    "sequence" INTEGER NOT NULL,

    CONSTRAINT "active_hand_cards_pkey" PRIMARY KEY ("hand_id","sequence"),
    CONSTRAINT "active_hand_cards_sequence_check" CHECK ("sequence" > 0)
);

-- CreateTable
CREATE TABLE "deck_cards" (
    "id" SERIAL NOT NULL,
    "game_id" INTEGER NOT NULL,
    "card_id" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "deck_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "active_mines_games" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "bet" DECIMAL(14,2) NOT NULL,
    "multiplier" DECIMAL(20,6) NOT NULL DEFAULT 1.000000,

    CONSTRAINT "active_mines_games_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "active_mines_games_bet_check" CHECK ("bet" > 0),
    CONSTRAINT "active_mines_games_multiplier_check" CHECK ("multiplier" >= 1)
);

-- CreateTable
CREATE TABLE "active_cells" (
    "game_id" INTEGER NOT NULL,
    "field" INTEGER NOT NULL,
    "is_gem" BOOLEAN NOT NULL,
    "is_revealed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "active_cells_pkey" PRIMARY KEY ("game_id","field"),
    CONSTRAINT "active_cells_field_check" CHECK ("field" BETWEEN 0 AND 24)
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- The application treats usernames and emails as case-insensitive.
CREATE UNIQUE INDEX "users_username_lower_key" ON "users"(LOWER("username"));
CREATE UNIQUE INDEX "users_email_lower_key" ON "users"(LOWER("email"));

-- CreateIndex
CREATE UNIQUE INDEX "cards_rank_suit_key" ON "cards"("rank", "suit");

-- One retained blackjack game per user; completed games are replaced when a new game starts.
CREATE UNIQUE INDEX "active_blackjack_games_user_id_key" ON "active_blackjack_games"("user_id");

-- CreateIndex
CREATE INDEX "active_hands_game_id_idx" ON "active_hands"("game_id");

-- CreateIndex
CREATE INDEX "active_hand_cards_card_id_idx" ON "active_hand_cards"("card_id");

-- CreateIndex
CREATE INDEX "deck_cards_game_id_is_active_idx" ON "deck_cards"("game_id", "is_active");

-- CreateIndex
CREATE INDEX "deck_cards_card_id_idx" ON "deck_cards"("card_id");

-- Only one active mines game can exist for a user.
CREATE UNIQUE INDEX "active_mines_games_user_id_key" ON "active_mines_games"("user_id");

-- AddForeignKey
ALTER TABLE "active_blackjack_games" ADD CONSTRAINT "active_blackjack_games_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "active_hands" ADD CONSTRAINT "active_hands_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "active_blackjack_games"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "active_hand_cards" ADD CONSTRAINT "active_hand_cards_hand_id_fkey" FOREIGN KEY ("hand_id") REFERENCES "active_hands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "active_hand_cards" ADD CONSTRAINT "active_hand_cards_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "cards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deck_cards" ADD CONSTRAINT "deck_cards_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "active_blackjack_games"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deck_cards" ADD CONSTRAINT "deck_cards_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "cards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "active_mines_games" ADD CONSTRAINT "active_mines_games_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "active_cells" ADD CONSTRAINT "active_cells_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "active_mines_games"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed the canonical 52-card catalog. The blackjack deck builder depends on IDs 1 through 52.
INSERT INTO "cards" ("id", "rank", "suit", "value") VALUES
    (1,  'A',  'C', 11),
    (2,  '2',  'C', 2),
    (3,  '3',  'C', 3),
    (4,  '4',  'C', 4),
    (5,  '5',  'C', 5),
    (6,  '6',  'C', 6),
    (7,  '7',  'C', 7),
    (8,  '8',  'C', 8),
    (9,  '9',  'C', 9),
    (10, '10', 'C', 10),
    (11, 'J',  'C', 10),
    (12, 'Q',  'C', 10),
    (13, 'K',  'C', 10),
    (14, 'A',  'D', 11),
    (15, '2',  'D', 2),
    (16, '3',  'D', 3),
    (17, '4',  'D', 4),
    (18, '5',  'D', 5),
    (19, '6',  'D', 6),
    (20, '7',  'D', 7),
    (21, '8',  'D', 8),
    (22, '9',  'D', 9),
    (23, '10', 'D', 10),
    (24, 'J',  'D', 10),
    (25, 'Q',  'D', 10),
    (26, 'K',  'D', 10),
    (27, 'A',  'H', 11),
    (28, '2',  'H', 2),
    (29, '3',  'H', 3),
    (30, '4',  'H', 4),
    (31, '5',  'H', 5),
    (32, '6',  'H', 6),
    (33, '7',  'H', 7),
    (34, '8',  'H', 8),
    (35, '9',  'H', 9),
    (36, '10', 'H', 10),
    (37, 'J',  'H', 10),
    (38, 'Q',  'H', 10),
    (39, 'K',  'H', 10),
    (40, 'A',  'S', 11),
    (41, '2',  'S', 2),
    (42, '3',  'S', 3),
    (43, '4',  'S', 4),
    (44, '5',  'S', 5),
    (45, '6',  'S', 6),
    (46, '7',  'S', 7),
    (47, '8',  'S', 8),
    (48, '9',  'S', 9),
    (49, '10', 'S', 10),
    (50, 'J',  'S', 10),
    (51, 'Q',  'S', 10),
    (52, 'K',  'S', 10);
