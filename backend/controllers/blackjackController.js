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

  isBlackjack,
  isCardAce,
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
  let offerInsurance = false;
  let payout = 0;
  let formattedData = {
    data: {
      player: {},
      dealer: {},
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
      game_id
    );
    // Hit for dealer
    const dealerCard = await pullCardFromDeck(
      dealer_hand_id,
      1,
      client,
      game_id,
      13
    );

    const secondPlayerCard = await pullCardFromDeck(
      player_hand_id,
      2,
      client,
      game_id
    );

    // Hit for dealer
    const secondDealerCard = await pullCardFromDeck(
      dealer_hand_id,
      2,
      client,
      game_id
    );
    const dealerHasAce = isCardAce(dealerCard);
    dealerCards = [dealerCard, secondDealerCard];
    playerCards = [playerCard, secondPlayerCard];

    const isDealerBlackjack = isBlackjack(dealerCards);
    const isPlayerBlackjack = isBlackjack(playerCards);

    // Dealer has ace without player blackjack, offer insurance
    if (dealerHasAce && !isPlayerBlackjack) {
      offerInsurance = true;
      // Set value to true in game state in DB
      await client.query(blackjackQueries.setOfferInsurance, [game_id]);
    }

    const { gameWinner, payoutResult } = await findEarlyGameWinner(
      isDealerBlackjack,
      isPlayerBlackjack,

      offerInsurance,
      bet,
      userID,
      client
    );
    payout = payoutResult;
    if (gameWinner) {
      await client.query(blackjackQueries.setGameOver, [game_id]);
      formattedData.data.is_game_over = true;
      formattedData.data.game_winners = [gameWinner];
    }

    // await client.query("COMMIT");
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
  formattedData.data.offerInsurance = offerInsurance;
  formattedData.data.payout = payout;
  res.status(200).json(formattedData);
};

const findEarlyGameWinner = async (
  isDealerBlackjack,
  isPlayerBlackjack,
  offerInsurance,
  bet,
  userID,
  client
) => {
  let results = {};

  if (isDealerBlackjack && isPlayerBlackjack) {
    results.gameWinner = "push";
    // Return bet to player
    results.payoutResult = bet;
    await client.query(casinoQueries.depositBalance, [bet, userID]);
    return results;
  }

  if (offerInsurance) return results;

  if (isDealerBlackjack && !isPlayerBlackjack) {
    results.gameWinner = "dealer";
    return results;
  }
  if (!isDealerBlackjack && isPlayerBlackjack) {
    results.gameWinner = "player";
    // Payout player 3:2

    const payout = bet + bet * 1.5;

    results.payoutResult = payout;
    await client.query(casinoQueries.depositBalance, [payout, userID]);
    return results;
  }
};

exports.getGame = async (req, res, next) => {
  const activeHand = req.game.activeHand;
  const nextHand = req.game.nextHand;
  let bet = activeHand.bet;

  if (nextHand) {
    bet += nextHand.bet;
  }

  bet = bet.toFixed(2);

  const formattedData = {
    data: {
      player: {
        hands: [],
        selectedHandIndex: 0,
      },
      dealer: {},
      is_game_over: req.game.is_game_over,
      bet: req.game.start_bet,
    },
  };

  const dealerData = (
    await pool.query(blackjackQueries.getHandData, [req.game.id, false])
  ).rows;

  validateAceValue(activeHand.cards);
  formattedData.data.player.hands.push(activeHand.cards);

  if (nextHand) {
    if (nextHand.id > activeHand.id) {
      formattedData.data.player.selectedHandIndex = 1;
      formattedData.data.player.hands.unshift(nextHand.cards);
    } else formattedData.data.player.hands.push(nextHand.cards);
  }

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
  formattedData.data.dealer = dealerDataFormatted;

  res.status(200).json(formattedData);
  return;
};

// HIT HIT HIT HIT
// TODO: if the hand is split, we need to check when to conclude the game
exports.hit = async (req, res, next) => {
  const userID = req.user.id;
  const { id: gameId, activeHand, nextHand } = req.game;

  let client;
  let results;
  const handArray = [activeHand, nextHand].filter(Boolean);

  try {
    client = await pool.connect();
    await client.query("BEGIN");

    results = await hit(client, gameId, activeHand);
    const { is_hand_bust, is_21 } = results.data;

    activeHand.is_bust = is_hand_bust;

    if (is_hand_bust) {
      if (!nextHand) {
        await client.query(blackjackQueries.setGameOver, [gameId]);
        results.data.game_winners = ["dealer"];
        results.data.is_game_over = true;
      } else {
        // Hand is split so we just move to the next hand without ending game
        // The deselected hand is automatically completed in the DB
        if (nextHand.is_bust) {
          // Next hand is also bust so we just end the game on a loss, do not draw for dealer

          await client.query(blackjackQueries.setGameOver, [gameId]);
          results.data.game_winners = ["dealer", "dealer"];
          results.data.is_game_over = true;
        } else if (nextHand.is_completed) {
          // Next hand is over but not due to a bust, so we draw for dealer, end game.

          const standResults = await stand(client, gameId, handArray);
          results.data.is_game_over = true;
          results.data.game_winners = standResults.data.game_winners;
          results.data.dealer = standResults.data.dealer;
        } else {
          // Swaps and sets the active hand to bust and completed
          await swapSelectedHand(client, activeHand.id, nextHand.id, true);

          results.data.goToNextHand = true;
        }
      }
    } else if (is_21) {
      // If we are at 21, then we stand

      // Pass in the cards from the results at it is the most up to date
      if (!nextHand) {
        const standResults = await stand(client, gameId, handArray);
        results.data.dealer = standResults.data.dealer;
        results.data.is_game_over = true;
        results.data.game_winners = standResults.data.game_winners;
      } else {
        // Hand is split so we just move to the next hand without ending game
        if (nextHand.is_bust || nextHand.is_completed) {
          const standResults = await stand(client, gameId, handArray);
          results.data.is_game_over = true;
          results.data.game_winners = standResults.data.game_winners;
          results.data.dealer = standResults.data.dealer;
        } else {
          await swapSelectedHand(client, activeHand.id, nextHand.id, false);
          results.data.goToNextHand = true;
        }
      }
    }

    results.data.payout = await payoutPlayer(
      client,
      userID,
      results.data.game_winners,
      handArray
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
  const { id: gameId, activeHand, nextHand } = req.game;
  const userID = req.user.id;

  const handArray = [activeHand, nextHand].filter(Boolean);
  let client;
  let formattedData = {
    data: {
      game_winners: [],
    },
  };

  try {
    client = await pool.connect();
    await client.query("BEGIN");
    if (!nextHand) {
      formattedData = await stand(client, gameId, handArray);
      formattedData.data.is_game_over = true;
    } else {
      if (nextHand.is_completed || nextHand.is_bust) {
        formattedData = await stand(client, gameId, handArray);

        formattedData.data.is_game_over = true;
      } else {
        // Swap the hand
        await swapSelectedHand(client, activeHand.id, nextHand.id, false);
        formattedData.data.goToNextHand = true;
      }
    }

    formattedData.data.payout = await payoutPlayer(
      client,
      userID,
      formattedData.data.game_winners,
      handArray
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
  const { id: gameId, activeHand, nextHand } = req.game;
  const userID = req.user.id;

  // payableBet is the bet amount the player can be payed out for. Prevents paying out double on activeHands that bust but nextHands that win without doubling
  let handArray = [activeHand, nextHand].filter(Boolean);
  console.log(handArray);
  let client;
  let formattedData = {
    data: {},
  };

  try {
    client = await pool.connect();
    await client.query("BEGIN");

    formattedData = await double(client, gameId, userID, activeHand);

    const { is_hand_bust } = formattedData.data;

    activeHand.is_bust = is_hand_bust;
    // TODO: is_doubled is obselete after the new bet column in DB, so remove later

    if (!nextHand) {
      formattedData.data.is_game_over = true;
      if (is_hand_bust) {
        await client.query(blackjackQueries.setGameOver, [gameId]);
        formattedData.data.game_winners = ["dealer"];
      } else {
        const results = await stand(client, gameId, handArray);
        formattedData.data.game_winners = results.data.game_winners;
        formattedData.data.dealer = results.data.dealer;
      }
    } else if (nextHand.is_completed || nextHand.is_bust) {
      formattedData.data.is_game_over = true;
      // Both hands are bust so dealer wins
      if (is_hand_bust && nextHand.is_bust) {
        await client.query(blackjackQueries.setGameOver, [gameId]);
        formattedData.data.game_winners = ["dealer", "dealer"];
        // Calculate winners
      } else {
        // Stand sorts handArray by id, greatest first
        const results = await stand(client, gameId, handArray);
        formattedData.data.game_winners = results.data.game_winners;
        formattedData.data.dealer = results.data.dealer;
      }
    } else {
      await swapSelectedHand(client, activeHand.id, nextHand.id, is_hand_bust);
      formattedData.data.goToNextHand = true;
    }

    formattedData.data.payout = await payoutPlayer(
      client,
      userID,
      formattedData.data.game_winners,
      handArray
    );

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
  let activeHand = req.game.activeHand;

  const initBet = activeHand.bet;
  const userID = req.user.id;

  let formattedData = {
    data: {
      player: {
        hands: [],
        selectedHandIndex: 1,
      },
      dealer: {},
    },
  };

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

    if (activeHand.cards.length >= 3) {
      throw new AppError("Cannot split after hitting!", 401, "INVALID_ACTION");
    }

    if (activeHand.cards[0].rank !== activeHand.cards[1].rank) {
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
        activeHand.id,
        1,
      ])
    ).rows[0];

    // Create a new hand but make it unselected
    const newHandId = (
      await client.query(blackjackQueries.createNewHand, [
        gameId,
        true,
        false,
        initBet,
      ])
    ).rows[0].id;

    // Add removed card to new hand
    await client.query(blackjackQueries.addCardToHand, [
      newHandId,
      removedCard.card_id,
      1,
    ]);

    // Create for hit function
    let newHandData = {
      id: newHandId,
      cards: [
        {
          suit: activeHand.cards[0].suit,
          rank: activeHand.cards[0].rank,
          value: activeHand.cards[0].value,
          sequence: activeHand.cards[0].sequence,
        },
      ],
    };

    // Remove on local object
    activeHand.cards.shift();

    // At this point the original hand is still the selected one so now we hit once for each hand

    // Hit for original hand
    const originalHandResults = await hit(client, gameId, activeHand);

    // Hit for new hand
    const newHandResults = await hit(client, gameId, newHandData);

    formattedData.data.player.hands.push(newHandResults.data.player.cards);
    formattedData.data.player.hands.push(originalHandResults.data.player.cards);

    if (newHandResults.data.is_21 && originalHandResults.data.is_21) {
      // Both hands get 21 so we now officially stand and draw for dealer
      // We do not have to set the hands to completed in the DB as the game is now officially over here

      formattedData.data.is_game_over = true;
      await client.query(blackjackQueries.setGameOver, [gameId]);

      // Draw for dealer
      const dealerDrawResults = await dealerDrawFor17(client, gameId);
      const winnings = calculateWinnings(
        dealerDrawResults,
        [
          newHandResults.data.player.cards,
          originalHandResults.data.player.cards,
        ],
        initBet
      );
      formattedData.data.payout = winnings.totalPayout;
      formattedData.data.game_winners = winnings.winners;
      formattedData.data.dealer.cards = dealerDrawResults.cards;
      // Deposit winning
      if (winnings.totalPayout > 0) {
        await client.query(casinoQueries.depositBalance, [
          winnings.totalPayout,
          userID,
        ]);
      }

      // Set game over in DB
      await client.query(blackjackQueries.setGameOver, [gameId]);
    } else if (originalHandResults.data.is_21) {
      await swapSelectedHand(client, activeHand.id, newHandId, false);

      formattedData.data.player.selectedHandIndex = 0;
    } else if (newHandResults.data.is_21) {
      // If the new hand gets 21 then it "stands" so we complete the hand
      await client.query(blackjackQueries.completeHand, [newHandId]);
    }

    // TODO: Edit DOUBLE rules to comply with this setup

    await client.query("COMMIT");

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
