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
  let dealerCards;
  let playerCards;
  // ACID Transaction begins to deduct balance and create a new game
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    if (!bet) {
      throw new AppError("Could not place bet", 401, "INVALID_BET");
    }
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
      game_id,
      false
    );
    // Hit twice for player
    const playerCard = await pullCardFromDeck(
      player_hand_id,
      1,
      client,
      game_id,
      true
    );
    const secondPlayerCard = await pullCardFromDeck(
      player_hand_id,
      2,
      client,
      game_id,
      true
    );

    dealerCards = [dealerCard];
    playerCards = [playerCard, secondPlayerCard];

    await client.query("COMMIT");
  } catch (err) {
    console.log("FAIL");
    console.log(err);
    await client.query("ROLLBACK");
    res.status(400).json({
      data: "Server Error",
    });
    return;
  } finally {
    console.log("DONE");
    client.release();
  }

  res.status(200).json({
    data: {
      player: {
        cards: playerCards,
        is_soft: false,
      },
      dealer: {
        cards: dealerCards,
        is_soft: false,
      },
    },
  });
};

exports.action = (req, res, next) => {};

exports.getGame = async (req, res, next) => {
  const userID = req.user.id;
  // Check for in-progress game
  const game = (await pool.query(blackjackQueries.findInProgressGame, [userID]))
    .rows[0];

  if (game) {
    const playerData = (
      await pool.query(blackjackQueries.getHandData, [game.id, true])
    ).rows;

    const dealerData = (
      await pool.query(blackjackQueries.getHandData, [game.id, false])
    ).rows;

    const playerDataFormatted = {
      cards: playerData.map((row) => ({
        suit: row.suit,
        rank: row.rank,
        value: row.value,
        sequence: row.sequence,
      })),
      is_soft: playerData[0].is_soft,
    };

    const dealerDataFormatted = {
      cards: dealerData.map((row) => ({
        suit: row.suit,
        rank: row.rank,
        value: row.value,
        sequence: row.sequence,
      })),
      is_soft: dealerData[0].is_soft,
    };

    const formattedData = {
      data: {
        player: playerDataFormatted,
        dealer: dealerDataFormatted,
      },
    };

    res.status(200).json(formattedData);
    return;
  } else {
    res.status(404).json({
      data: "No game found",
    });
  }
};

const pullCardFromDeck = async (handId, sequence, client, gameId) => {
  const deckCards = (
    await client.query(blackjackQueries.getActiveDeckCards, [gameId])
  ).rows;
  const randomCardNumber = secureRandomNumber(0, deckCards.length - 1);
  const hitCard = deckCards[randomCardNumber];
  console.log(hitCard);
  await client.query(blackjackQueries.setDeckCardToInactive, [
    hitCard.deck_card_id,
  ]);

  // Add card to hand
  await client.query(blackjackQueries.addCardToHand, [
    handId,
    hitCard.id,
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
