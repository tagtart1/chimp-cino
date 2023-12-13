const AppError = require("../utils/appError");
const asyncHandler = require("express-async-handler");
const pool = require("../db");
const casinoQueries = require("../queries/casinoQueries");
const blackjackQueries = require("../queries/blackjackQueries");
const secureRandomNumber = require("../utils/secureRandomNumber");

exports.newGame = async (req, res, next) => {
  const NUMBER_OF_DECKS = 2;
  const bet = parseFloat(req.body.betAmount);
  const userID = req.user.id;
  let dealerCards;
  let playerCards;
  let formattedData = {
    data: {
      player: {},
      dealer: {},
      game_winner: "",
      is_game_over: false,
    },
  };
  // ACID Transaction begins to deduct balance and create a new game
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    console.log(bet);
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
      throw new AppError("Game already in progress", 401, "INVALID_ACTION");
    } else if (game) {
      // Delete old game since it is over
      await endGame(game.id, client);
    }

    // Create a new blackjack game
    const { game_id, player_hand_id, dealer_hand_id } = (
      await client.query(blackjackQueries.createNewBlackjackGame, [userID, bet])
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
      game_id
    );
    // Hit once for dealer
    const dealerCard = await pullCardFromDeck(
      dealer_hand_id,
      1,
      client,
      game_id
    );

    const secondPlayerCard = await pullCardFromDeck(
      player_hand_id,
      2,
      client,
      game_id,
      6
    );

    const secondDealerCard = await pullCardFromDeck(
      dealer_hand_id,
      2,
      client,
      game_id
    );

    dealerCards = [dealerCard, secondDealerCard];
    playerCards = [playerCard, secondPlayerCard];

    const isDealerBlackjack = isBlackjack(dealerCards);
    const isPlayerBlackjack = isBlackjack(playerCards);

    let gameWinner;

    if (isDealerBlackjack && !isPlayerBlackjack) {
      gameWinner = "dealer";
    } else if (!isDealerBlackjack && isPlayerBlackjack) {
      gameWinner = "player";
      // Payout player 3:2
      console.log("Player blackjack bet: ", bet);
      const payout = bet + bet * 1.5;
      console.log("Player blackjack payout: ", payout);
      formattedData.data.payout = payout;
      await client.query(casinoQueries.depositBalance, [payout, userID]);
    } else if (isDealerBlackjack && isPlayerBlackjack) {
      gameWinner = "push";
      // Return bet to player
      formattedData.data.payout = bet;
      await client.query(casinoQueries.depositBalance, [bet, userID]);
    }

    if (gameWinner) {
      await client.query(blackjackQueries.setGameOver, [game_id]);
      formattedData.data.is_game_over = true;
      formattedData.data.game_winner = gameWinner;
    }

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

  // Hide the second dealer card unless game is over
  if (!formattedData.data.is_game_over) dealerCards.pop();

  validateAceValue(playerCards);
  validateAceValue(dealerCards);

  formattedData.data.player.cards = playerCards;
  formattedData.data.dealer.cards = dealerCards;
  res.status(200).json(formattedData);
};

exports.getGame = async (req, res, next) => {
  const userID = req.user.id;

  // Check for in-progress game
  const game = (await pool.query(blackjackQueries.findInProgressGame, [userID]))
    .rows[0];

  if (game) {
    const bet = game.bet;
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
    // Remove the face down card to not reveal
    if (dealerDataFormatted.cards.length === 2) {
      dealerDataFormatted.cards.pop();
    }
    validateAceValue(dealerDataFormatted.cards);
    dealerDataFormatted.is_soft = isHandSoft(dealerDataFormatted.cards);

    const formattedData = {
      data: {
        player: playerDataFormatted,
        dealer: dealerDataFormatted,
        is_game_over: game.is_game_over,
        bet: bet,
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

// We need to send handID from the frontend for splitting
// HIT HIT HIT HIT
exports.hit = async (req, res, next) => {
  const gameId = req.game.id;
  const bet = parseFloat(req.game.bet);
  const userID = req.user.id;

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
    // Grab player hand
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

    const newCard = await pullCardFromDeck(
      playerHandId,
      newSequence,
      client,
      gameId
    );

    playerHandFormatted.cards.push(newCard);
    validateAceValue(playerHandFormatted.cards);

    // TO DO: Check for 21 or bust here
    // If we get 21 off a hit we do the same action as a "stand"
    // If we get over 21 we bust and set game is over
    //
    const isPlayerBust = checkForBust(playerHandFormatted.cards);
    if (isPlayerBust) {
      await client.query(blackjackQueries.setGameOver, [gameId]);
      formattedData.data.is_game_over = isPlayerBust;
      formattedData.data.game_winner = "dealer";
    } else if (checkFor21(playerHandFormatted.cards)) {
      formattedData.data.is_game_over = true;

      const dealerDrawResults = await dealerDrawFor17(client, gameId);
      await client.query(blackjackQueries.setGameOver, [gameId]);

      // Determine winner
      if (dealerDrawResults.isBust || dealerDrawResults.handValue < 21) {
        formattedData.data.game_winner = "player";
        // Payout user double
        const payout = bet * 2;
        formattedData.data.payout = payout;
        await client.query(casinoQueries.depositBalance, [payout, userID]);
      } else if (dealerDrawResults.handValue === 21) {
        // Return bet
        formattedData.data.payout = bet;
        await client.query(casinoQueries.depositBalance, [bet, userID]);
        formattedData.data.game_winner = "push";
      }

      formattedData.data.dealer = {
        cards: dealerDrawResults.cards,
        is_soft: isHandSoft(dealerDrawResults.cards),
      };
      // Return formatted data for both
    }

    playerHandFormatted.is_soft = isHandSoft(playerHandFormatted.cards);
    formattedData.data.player = playerHandFormatted;

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

exports.stand = async (req, res, next) => {
  const gameId = req.game.id;
  const bet = parseFloat(req.game.bet);
  const userID = req.user.id;

  if (req.game.is_game_over) {
    next(new AppError("Game is already over!", 401, "INVALID_ACTION"));
    return;
  }

  let client;
  let formattedData = {
    data: {
      dealer: null,
      is_game_over: true,
    },
  };

  try {
    client = await pool.connect();
    await client.query("BEGIN");

    // Grab player hand
    const playerHandData = (
      await client.query(blackjackQueries.getHandData, [gameId, true])
    ).rows;

    let playerTotal = playerHandData.reduce(
      (total, card) => total + card.value,
      0
    );

    // Draw dealer cards
    const dealerDrawResults = await dealerDrawFor17(client, gameId);

    // Set game over in DB
    await client.query(blackjackQueries.setGameOver, [gameId]);

    // Check who wins
    if (dealerDrawResults.isBust || dealerDrawResults.handValue < playerTotal) {
      console.log("STAND, player wins and here is the total: ", playerTotal);
      // Player wins
      formattedData.data.game_winner = "player";

      // Payout double
      const payout = bet * 2;
      formattedData.data.payout = payout;
      await client.query(casinoQueries.depositBalance, [payout, userID]);
    } else if (dealerDrawResults.handValue === playerTotal) {
      formattedData.data.game_winner = "push";

      // Return bet
      formattedData.data.payout = bet;
      await client.query(casinoQueries.depositBalance, [bet, userID]);
    } else if (
      !dealerDrawResults.isBust &&
      dealerDrawResults.handValue > playerTotal
    ) {
      formattedData.data.game_winner = "dealer";
    }

    // Add dealer cards to returned data
    formattedData.data.dealer = {
      cards: dealerDrawResults.cards,
      // is_soft may be deprecated soon
      is_soft: isHandSoft(dealerDrawResults.cards),
    };

    await client.query("COMMIT");
  } catch (err) {
    console.log(err);
    await client.query("ROLLBACK");
    next(new AppError(err.message, 400, "INVALID_ACTION"));
  } finally {
    client.release();
  }

  res.status(200).json(formattedData);
};

// Keeps drawing untill the dealer total is at 17 or higher;
const dealerDrawFor17 = async (client, gameId) => {
  // Grab dealer hand data and store for initial cards array
  // Start loop to pull cards from deck till dealer is above or at soft 17
  // In looop, pull card, then check if at or above 17
  // Return cards array and total value in seperate property
  // Use the value for determining win and the cards array to send back to client
  const dealerHandData = (
    await client.query(blackjackQueries.getHandData, [gameId, false])
  ).rows;
  const dealerHandId = dealerHandData[0].hand_id;

  let newSequence = dealerHandData.length + 1;

  let dealerHandFormatted = {
    cards: dealerHandData.map((row) => ({
      suit: row.suit,
      rank: row.rank,
      value: row.value,
      sequence: row.sequence,
    })),
  };

  let handValue = dealerHandFormatted.cards.reduce((value, card) => {
    return value + card.value;
  }, 0);
  while (handValue < 17) {
    const newCard = await pullCardFromDeck(
      dealerHandId,
      newSequence,
      client,
      gameId
    );

    dealerHandFormatted.cards.push(newCard);
    validateAceValue(dealerHandFormatted.cards, true);
    handValue = dealerHandFormatted.cards.reduce((value, card) => {
      return value + card.value;
    }, 0);
    newSequence++;
  }
  dealerHandFormatted.handValue = handValue;
  dealerHandFormatted.isSoft = isHandSoft(dealerHandFormatted.cards);
  dealerHandFormatted.isBust = checkForBust(dealerHandFormatted.cards);
  console.log(dealerHandFormatted);
  return dealerHandFormatted;
};

const checkFor21 = (cards) => {
  let totalValue = 0;
  for (const card of cards) {
    totalValue += card.value;
  }

  if (totalValue === 21) {
    // Game is bust, end game
    return true;
  } else return false;
};

const checkForBust = (cards) => {
  let totalValue = 0;
  for (const card of cards) {
    totalValue += card.value;
  }

  if (totalValue > 21) {
    // Game is bust, end game
    return true;
  } else return false;
};

// Modifies the most recent ace to stay 11 or 1
const validateAceValue = (cards, isDealer) => {
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

// Later conditionally render returning the deck id
const pullCardFromDeck = async (handId, sequence, client, gameId, rig) => {
  const deckCards = (
    await client.query(blackjackQueries.getActiveDeckCards, [gameId])
  ).rows;

  const randomCardNumber = secureRandomNumber(0, deckCards.length - 1);

  const hitCard = rig ? pullCard(deckCards, rig) : deckCards[randomCardNumber];

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
    id: hitCard.deck_card_id,
    rank: hitCard.rank,
    suit: hitCard.suit,
    value: hitCard.value,
    sequence,
  };
};

const pullCard = (deckCards, id) => {
  for (const card of deckCards) {
    if (card.id === id) {
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

const isBlackjack = (cards) => {
  let totalValue = 0;

  for (const card of cards) {
    totalValue += card.value;
  }

  if (totalValue === 21) return true;
  return false;
};

const endGame = async (gameId, client) => {
  await client.query(blackjackQueries.deleteGame, [gameId]);
};
