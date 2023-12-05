const AppError = require("../utils/appError");
const asyncHandler = require("express-async-handler");
const pool = require("../db");
const casinoQueries = require("../queries/casinoQueries");
const blackjackQueries = require("../queries/blackjackQueries");
const secureRandomNumber = require("../utils/secureRandomNumber");

exports.newGame = async (req, res, next) => {
  const NUMBER_OF_DECKS = 2;
  const bet = req.body.betAmount;
  const userID = req.user.id;
  let hitCards = {};
  // ACID Transaction begins to deduct balance and create a new game
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Withdraw bet from user's balance
    const withdrawBet = await client.query(casinoQueries.withdrawBalance, [
      bet,
      userID,
    ]);

    if (withdrawBet.rowCount === 0) {
      throw new AppError(
        "Could not place bet: Insufficient funds",
        401,
        "INVALID_BET"
      );
    }
    // Check for in-progress game
    const game = (
      await client.query(blackjackQueries.findInProgressGame, [userID])
    ).rows[0];

    if (game) {
      // TRROW ERROR ONCE WE FINISH THE GAME LOOP
      await endGame(game.id, client);
      await client.query("COMMIT");
      return;
      throw new AppError("Game already in progress", 401, "INVALID_ACTION");
    }

    // Create a new blackjack game
    const { game_id, player_hand_id, dealer_hand_id } = (
      await client.query(blackjackQueries.createNewBlackjackGame, [userID])
    ).rows[0];

    // Create a deck for the game
    const [queryText, values] = buildDeckQuery(game_id, NUMBER_OF_DECKS);
    await client.query(queryText, values);
    console.log(game_id);
    // Hit once for dealer
    const dealerCard = await pullCardFromDeck(
      dealer_hand_id,
      1,
      client,
      game_id
    );
    // Hit twice for player
    const playerCard = await pullCardFromDeck(
      dealer_hand_id,
      1,
      client,
      game_id
    );
    const secondPlayerCard = await pullCardFromDeck(
      player_hand_id,
      2,
      client,
      game_id
    );

    hitCards = {
      dealer: [dealerCard],
      player: [playerCard, secondPlayerCard],
    };

    await client.query("COMMIT");
  } catch (err) {
    console.log("FAIL");
    console.log(err);
    await client.query("ROLLBACK");
  } finally {
    console.log("DONE");
    client.release();
  }

  res.json({ data: hitCards });
};

exports.action = (req, res, next) => {};

const pullCardFromDeck = async (handId, sequence, client, gameId) => {
  console.log("Game id:", gameId);
  const deckCards = (
    await client.query(blackjackQueries.getActiveDeckCards, [gameId])
  ).rows;
  const randomCardNumber = secureRandomNumber(0, deckCards.length - 1);
  const hitCard = deckCards[randomCardNumber];

  await client.query(blackjackQueries.setDeckCardToInactive, [hitCard.id]);

  // Add card to hand
  await client.query(blackjackQueries.addCardToHand, [
    handId,
    hitCard.card_id,
    sequence,
  ]);

  return hitCard;
};

const buildDeckQuery = (gameId, NUMBER_OF_DECKS) => {
  const values = [];
  let placeholders = [];
  const amountOfCards = NUMBER_OF_DECKS * 52;
  let placeholderIndex = 1;

  for (let i = 1; i <= amountOfCards; i++) {
    const cardId = ((i - 1) % 52) + 1;

    values.push(gameId, cardId);
    placeholders.push(`($${placeholderIndex}, $${placeholderIndex + 1})`);
    placeholderIndex += 2;
  }

  const queryText = `INSERT INTO deck_cards (game_id, card_id) VALUES ${placeholders.join(
    ", "
  )};`;

  return [queryText, values];
};

const endGame = async (gameId, client) => {
  await client.query(blackjackQueries.deleteGame, [gameId]);
};
