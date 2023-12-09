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

    if (game && !game.is_game_over) {
      // TRROW ERROR ONCE WE FINISH THE GAME LOOP
      // await endGame(game.id, client);
      await client.query("COMMIT");

      throw new AppError("Game already in progress", 401, "INVALID_ACTION");
    } else if (game) {
      // Delete old game since it is over
      await endGame(game.id, client);
    }

    // Create a new blackjack game
    const { game_id, player_hand_id, dealer_hand_id } = (
      await client.query(blackjackQueries.createNewBlackjackGame, [userID])
    ).rows[0];

    // Create a deck for the game
    const [queryText, values] = buildDeckQuery(game_id, NUMBER_OF_DECKS);
    await client.query(queryText, values);
    console.log(game_id);
    // Hit twice for player
    // BUG: REMOVE any "rigging" from functions and params
    const playerCard = await pullCardFromDeck(
      player_hand_id,
      1,
      client,
      game_id,
      false
    );
    // Hit once for dealer
    const dealerCard = await pullCardFromDeck(
      dealer_hand_id,
      1,
      client,
      game_id,
      false
    );

    const secondPlayerCard = await pullCardFromDeck(
      player_hand_id,
      2,
      client,
      game_id,
      false,
      false
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

  validateAceValue(playerCards);
  validateAceValue(dealerCards);

  res.status(200).json({
    data: {
      player: {
        cards: playerCards,
        is_soft: isHandSoft(playerCards),
      },
      dealer: {
        cards: dealerCards,
        is_soft: isHandSoft(dealerCards),
      },
    },
  });
};

// We need to send handID from the frontend
exports.hit = async (req, res, next) => {
  const gameId = req.game.id;

  if (req.game.is_game_over) {
    next(new AppError("Game is already over!", 401, "INVALID_ACTION"));
    return;
  }

  let client;
  let formattedData = {
    data: {
      player: null,
      is_game_over: false,
    },
  };
  try {
    client = await pool.connect();
    await client.query("BEGIN");
    // Grab player han d
    const playerHandData = (
      await client.query(blackjackQueries.getHandData, [gameId, true])
    ).rows;

    const playerHandId = playerHandData[0].hand_id;
    const newSequence = playerHandData.length + 1;
    const playerHandFormatted = {
      cards: playerHandData.map((row) => ({
        suit: row.suit,
        rank: row.rank,
        value: row.value,
        sequence: row.sequence,
      })),
    };

    const should = playerHandData.length === 2;

    const newCard = await pullCardFromDeck(
      playerHandId,
      newSequence,
      client,
      gameId,
      should
    );

    playerHandFormatted.cards.push(newCard);
    validateAceValue(playerHandFormatted.cards);

    // TO DO: Check for 21 or bust here
    // If we get 21 off a hit we do the same action as a "stand"
    // If we get over 21 we bust and set game is over
    const isBust = checkForBust(playerHandFormatted.cards);
    if (isBust) {
      await client.query(blackjackQueries.setGameOver, [gameId]);
    }
    formattedData.data.is_game_over = isBust;
    playerHandFormatted.is_soft = isHandSoft(playerHandFormatted.cards);

    formattedData.data.player = playerHandFormatted;
    formattedData.data.is_game_over = isBust;
    console.log(playerHandFormatted.cards);
    await client.query("COMMIT");
  } catch (err) {
    console.log(err);
    await client.query("ROLLBACK");
    next(new AppError(err.message, 400, "INVALID_ACTION"));
    return;
  } finally {
    client.release();
  }

  res.status(200).json(formattedData);
};

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
    };
    validateAceValue(playerDataFormatted.cards);
    playerDataFormatted.is_soft = isHandSoft(playerDataFormatted.cards);

    const dealerDataFormatted = {
      cards: dealerData.map((row) => ({
        suit: row.suit,
        rank: row.rank,
        value: row.value,
        sequence: row.sequence,
      })),
    };
    validateAceValue(dealerDataFormatted.cards);
    dealerDataFormatted.is_soft = isHandSoft(dealerDataFormatted.cards);

    const formattedData = {
      data: {
        player: playerDataFormatted,
        dealer: dealerDataFormatted,
        is_game_over: game.is_game_over,
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

const checkForBust = (cards) => {
  let totalValue = 0;
  for (const card of cards) {
    totalValue += card.value;
  }
  // BUG: DO not check >=, handle 21 clause somewhere else
  if (totalValue >= 21) {
    // Game is bust, end game
    return true;
  } else return false;
};

// Modifies the most recent ace to stay 11 or 1
const validateAceValue = (cards) => {
  let totalValue = 0;
  for (const card of cards) {
    totalValue += card.value;
    if (totalValue > 21) {
      const ace = cards.find((c) => c.rank === "A" && c.value === 11);
      if (ace) {
        ace.value = 1;
        totalValue -= 10;
      }
    }
    // BUG: If we draw two normal cards then an ace THEN a normal card, we are setting the first card to value of 1 no matter what it is.
  }
};
const isHandSoft = (cards) => {
  // Checks for ace
  let hasAce = false;
  let totalValue = 0;
  for (const card of cards) {
    totalValue += card.value;

    if (card.rank === "A" && card.value === 11) {
      hasAce = true;
    }
  }

  if (hasAce && totalValue < 21) {
    return true;
  } else {
    return false;
  }
};

const pullCardFromDeck = async (
  handId,
  sequence,
  client,
  gameId,
  rig,
  twoRig
) => {
  const deckCards = (
    await client.query(blackjackQueries.getActiveDeckCards, [gameId])
  ).rows;
  const randomCardNumber = secureRandomNumber(0, deckCards.length - 1);

  const hitCard = rig
    ? pullAce(deckCards)
    : twoRig
    ? pullAceTwice(deckCards)
    : deckCards[randomCardNumber];
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

  return {
    rank: hitCard.rank,
    suit: hitCard.suit,
    value: hitCard.value,
    sequence,
  };
};

// DELETE LATER
const pullAce = (deckCards) => {
  for (const card of deckCards) {
    if (card.id === 26) {
      return card;
    }
  }
};

const pullAceTwice = (deckCards) => {
  for (const card of deckCards) {
    if (card.id === 13) {
      return card;
    }
  }
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
