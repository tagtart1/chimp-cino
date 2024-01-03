const AppError = require("../utils/appError");
const asyncHandler = require("express-async-handler");
const pool = require("../db");
const casinoQueries = require("../queries/casinoQueries");
const blackjackQueries = require("../queries/blackjackQueries");
const secureRandomNumber = require("../utils/secureRandomNumber");
const dealerDrawFor17 = require("../utils/dealerDrawFor17");
const buildDeckQuery = require("../utils/buildDeckQuery");
const pullCardFromDeck = require("../utils/pullCardFromDeck");
const {
  validateAceValue,
  checkFor21,
  checkForBust,
  isBlackjack,
  isHandSoft,
} = require("../utils/deckChecks");

const split = require("./blackjackOperations/split");
const hit = require("./blackjackOperations/hit");
const stand = require("./blackjackOperations/stand");
const payoutPlayer = require("../utils/payoutPlayer");
const double = require("./blackjackOperations/double");

exports.split = split;

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
      game_id,
      26
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
      9
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
  let results;

  try {
    client = await pool.connect();
    await client.query("BEGIN");
    // Grab player hand
    const handData = (
      await client.query(blackjackQueries.getHandData, [gameId, true])
    ).rows;
    results = await hit(client, gameId, handData);

    if (results.data.is_hand_bust) {
      await client.query(blackjackQueries.setGameOver, [gameId]);
      results.data.game_winner = "dealer";
      results.data.is_game_over = true;
    } else if (checkFor21(results.data.player.cards)) {
      // If we are at 21, then we stand
      const standResults = await stand(client, gameId, handData);
      results.data.dealer = standResults.data.dealer;
      results.data.is_game_over = true;
      results.data.game_winner = standResults.data.game_winner;
    }

    results.data.payout = await payoutPlayer(
      client,
      userID,
      results.data.game_winner,
      bet
    );

    await client.query("COMMIT");
  } catch (err) {
    console.log(err);
    await client.query("ROLLBACK");
    return next(new AppError(err.message, 400, "INVALID_ACTION"));
  } finally {
    client.release();
  }

  res.status(200).json(results);
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
  let formattedData = {};

  try {
    client = await pool.connect();
    await client.query("BEGIN");

    // Grab player hand
    const handData = (
      await client.query(blackjackQueries.getHandData, [gameId, true])
    ).rows;

    formattedData = await stand(client, gameId, handData);
    formattedData.data.is_game_over = true;

    formattedData.data.payout = await payoutPlayer(
      client,
      userID,
      formattedData.data.game_winner,
      bet
    );

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    return next(new AppError(err.message, 400, "INVALID_ACTION"));
  } finally {
    client.release();
  }

  res.status(200).json(formattedData);
};

// A Double doubles the bet, hits for 1 card and then stands
exports.double = async (req, res, next) => {
  // Hit once
  const gameId = req.game.id;
  const initBet = parseFloat(req.game.bet);
  const totalBet = initBet * 2;
  const userID = req.user.id;

  if (req.game.is_game_over) {
    return next(new AppError("Game is already over!", 401, "INVALID_ACTION"));
  }

  let client;
  let formattedData = {};

  try {
    client = await pool.connect();
    await client.query("BEGIN");

    // End the game
    await client.query(blackjackQueries.setGameOver, [gameId]);
    // Grab player hand
    const handData = (
      await client.query(blackjackQueries.getHandData, [gameId, true])
    ).rows;

    formattedData = await double(client, gameId, userID, handData, initBet);

    formattedData.data.payout = await payoutPlayer(
      client,
      userID,
      formattedData.data.game_winner,
      totalBet
    );

    formattedData.data.is_game_over = true;

    await client.query("COMMIT");
  } catch (err) {
    console.log(err);
    await client.query("ROLLBACK");
    if (err.isOperational) {
      return next(err);
    } else {
      return next(new AppError("Internal Server Error.", 400, "SERVER_ERROR"));
    }
  } finally {
    client.release();
  }
  res.status(200).json(formattedData);
};

// Keeps drawing untill the dealer total is at 17 or higher;

const endGame = async (gameId, client) => {
  await client.query(blackjackQueries.deleteGame, [gameId]);
};
