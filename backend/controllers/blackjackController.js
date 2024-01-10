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
const swapSelectedHand = require("../utils/swapSelectedHand");
const calculateWinnings = require("../utils/calculateWinnings");

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

    // Hit twice for player
    // BUG: REMOVE any "rigging" from functions and params
    const playerCard = await pullCardFromDeck(
      player_hand_id,
      1,
      client,
      game_id,
      4
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
      17
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

  formattedData.data.player.hands = [playerCards];
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
    const playerHand = (
      await pool.query(blackjackQueries.getHandData, [game.id, true])
    ).rows;

    const dealerData = (
      await pool.query(blackjackQueries.getHandData, [game.id, false])
    ).rows;

    const playerHandFormatted = playerHand.map((row) => ({
      suit: row.suit,
      rank: row.rank,
      value: row.value,
      sequence: row.sequence,
    }));

    validateAceValue(playerHandFormatted);
    playerHandFormatted.is_soft = isHandSoft(playerHandFormatted);

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
        player: {
          hands: [playerHandFormatted],
          selectedHandIndex: 0,
        },
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

// HIT HIT HIT HIT
// TODO: if the hand is split, we need to check when to conclude the game
exports.hit = async (req, res, next) => {
  const gameId = req.game.id;
  const bet = parseFloat(req.game.bet);
  const userID = req.user.id;
  const activeHand = req.game.activeHand;
  const nextHandId = req.game.nextHand;
  let client;
  let results;

  try {
    client = await pool.connect();
    await client.query("BEGIN");

    results = await hit(client, gameId, activeHand);

    if (results.data.is_hand_bust) {
      if (!nextHandId) {
        await client.query(blackjackQueries.setGameOver, [gameId]);
        results.data.game_winner = "dealer";
        results.data.is_game_over = true;
      } else {
        // Hand is split so we just move to the next hand without ending game
        await swapSelectedHand(client, activeHand[0].hand_id, nextHandId);
        results.data.goToNextHand = true;
      }
    } else if (results.data.is_21) {
      // If we are at 21, then we stand

      // Pass in the cards from the results at it is the most up to date
      if (!nextHandId) {
        const standResults = await stand(
          client,
          gameId,
          results.data.player.cards
        );
        results.data.dealer = standResults.data.dealer;
        results.data.is_game_over = true;
        results.data.game_winner = standResults.data.game_winner;
      } else {
        // Hand is split so we just move to the next hand without ending game
        await swapSelectedHand(client, activeHand[0].hand_id, nextHandId);
        results.data.goToNextHand = true;
      }
    }

    results.data.payout = await payoutPlayer(
      client,
      userID,
      results.data.game_winner,
      bet
    );

    await client.query("COMMIT");

    res.status(200).json(results);
  } catch (err) {
    console.log(err);
    await client.query("ROLLBACK");
    return next(new AppError(err.message, 400, "INVALID_ACTION"));
  } finally {
    client.release();
  }
};

exports.stand = async (req, res, next) => {
  const gameId = req.game.id;
  const bet = parseFloat(req.game.bet);
  const userID = req.user.id;

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
// Split hand flow is you play the the rightmost hand first, then move left after decision has been made
exports.split = async (req, res, next) => {
  let client;
  let gameId = req.game.id;
  const initBet = parseFloat(req.game.bet);
  const userID = req.user.id;

  let activeHand = req.game.activeHand;
  let formattedData = {
    data: {
      player: {
        hands: [],
        selectedHandIndex: 0,
      },
      dealer: {},
    },
  };
  // Check for pair

  try {
    client = await pool.connect();
    await client.query("BEGIN");

    const playerHandsAmount = await client.query(
      blackjackQueries.getCountOfPlayerHands,
      [gameId]
    );

    if (playerHandsAmount > 1) {
      throw new AppError("You can only split once!", 401, "INVALID_ACTION");
    }
    //  - Check for 3 or more cards

    if (activeHand.length >= 3) {
      throw new AppError("Cannot split after hitting!", 401, "INVALID_ACTION");
    }

    if (activeHand[0].rank !== activeHand[1].rank) {
      throw new AppError("Cannot split non-pairs", 401, "INVALID_ACTION");
    }

    // Double the bet again
    const withdrawBet = await client.query(casinoQueries.withdrawBalance, [
      initBet,
      userID,
    ]);

    if (withdrawBet.rowCount === 0) {
      throw new AppError(
        "Could not place bet: Insufficient funds",
        401,
        "INVALID_BET"
      );
    }

    // Split the hand, create a new hand from the first card
    // Remove first card from original hand
    const removedCard = (
      await client.query(blackjackQueries.removeCardFromHand, [
        activeHand[0].hand_id,
        1,
      ])
    ).rows[0];

    // Create a new hand but make it unselected
    const newHandId = (
      await client.query(blackjackQueries.createNewHand, [gameId, true, false])
    ).rows[0].id;

    // Add removed card to new hand
    await client.query(blackjackQueries.addCardToHand, [
      newHandId,
      removedCard.card_id,
      1,
    ]);

    // Create for hit function
    let newHandData = [
      {
        hand_id: newHandId,
        suit: activeHand[0].suit,
        rank: activeHand[0].rank,
        value: activeHand[0].value,
        sequence: activeHand[0].sequence,
      },
    ];

    // Remove on local object
    activeHand.shift();

    // At this point the original hand is still the selected one so now we hit once for each hand

    // Hit for original hand
    const originalHandResults = await hit(client, gameId, activeHand);

    // Hit for new hand
    const newHandResults = await hit(client, gameId, newHandData);

    formattedData.data.player.hands.push(originalHandResults.data.player.cards);
    formattedData.data.player.hands.push(newHandResults.data.player.cards);

    if (newHandResults.is_21 && originalHandResults.is_21) {
      // Both hands get 21 so we now officially stand and draw for dealer
      // We do not have to set the hands to completed in the DB as the game is now officially over here
      formattedData.data.is_game_over = true;
      await client.query(blackjackQueries.setGameOver, [gameId]);

      // Draw for dealer
      const dealerDrawResulsts = await dealerDrawFor17(client, gameId);
      const winnings = calculateWinnings(
        dealerDrawResulsts,
        [
          newHandResults.data.player.cards,
          originalHandResults.data.player.cards,
        ],
        initBet
      );
      formattedData.data.payout = winnings.totalPayout;
      formattedData.data.game_winner = winnings.winners;
      // Deposit winning
      if (winnings.totalPayout > 0) {
        await client.query(casinoQueries.depositBalance, [
          winnings.totalPayout,
          userID,
        ]);
      }

      // Set game over in DB
      await client.query(blackjackQueries.setGameOver, [gameId]);
    } else if (originalHandResults.is_21) {
      await swapSelectedHand(client, activeHand[0].hand_id, newHandId);
      formattedData.data.player.selectedHandIndex = 1;
    } else if (newHandResults.is_21) {
      // If the new hand gets 21 then it "stands" so we complete the hand
      await client.query(blackjackQueries.completeHand, [newHandId]);
    }

    // TODO: Edit DOUBLE rules to comply with this setup

    // await client.query("COMMIT");

    res.status(200).json(formattedData);
  } catch (error) {
    await client.query("ROLLBACK");
    return next(error);
  } finally {
    client.release();
  }
};

const endGame = async (gameId, client) => {
  await client.query(blackjackQueries.deleteGame, [gameId]);
};
