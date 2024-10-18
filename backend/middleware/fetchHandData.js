const AppError = require("../utils/appError");
const { getPool } = require("../db");
const blackjackQueries = require("../queries/blackjackQueries");

const fetchHandData = async (req, res, next) => {
  const gameId = req.game.id;
  const pool = getPool();
  try {
    const activeHandResult = (
      await pool.query(blackjackQueries.getActiveHand, [gameId])
    ).rows;

    const activeHandFormatted = activeHandResult.map((card) => ({
      suit: card.suit,
      rank: card.rank,
      value: card.value,
      sequence: card.sequence,
    }));

    const activeHandInfo = {
      cards: activeHandFormatted,
      id: activeHandResult[0].hand_id,
      bet: parseFloat(activeHandResult[0].bet),
    };

    req.game.activeHand = activeHandInfo;

    // Fetches hands that are the players, and unselected
    // Returns the id and completed status
    // Note to futre, this implementation here can only accept 1 other hand. If wanting to be able to split more than once you must rewrite some stuff bucko

    const splitHandResult = (
      await pool.query(blackjackQueries.getSplitHandInfo, [gameId])
    ).rows;

    if (splitHandResult.length === 0) return next();

    const splitHandFormatted = splitHandResult.map((card) => ({
      suit: card.suit,
      rank: card.rank,
      value: card.value,
      sequence: card.sequence,
    }));

    const splitHandInfo = {
      cards: splitHandFormatted,
      id: splitHandResult[0].id,
      is_bust: splitHandResult[0].is_bust,
      is_completed: splitHandResult[0].is_completed,
      bet: parseFloat(splitHandResult[0].bet),
    };

    req.game.nextHand = splitHandInfo;

    next();
  } catch (error) {
    console.log(error);
    return next(
      new AppError("Failed to get blackjack hand", 400, "SERVER_ERROR")
    );
  }
};

module.exports = fetchHandData;
