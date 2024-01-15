const AppError = require("../utils/appError");
const pool = require("../db");
const blackjackQueries = require("../queries/blackjackQueries");

const fetchHandData = async (req, res, next) => {
  const gameId = req.game.id;

  try {
    const activeHand = (
      await pool.query(blackjackQueries.getActiveHand, [gameId, true])
    ).rows;

    req.game.activeHand = activeHand;

    // Fetches hands that are the players, and unselected
    // Returns the id and completed status
    // Note to futre, this implementation here can only accept 1 other hand. If wanting to be able to split more than once you must rewrite some stuff bucko
    const splitHandInfo = (
      await pool.query(blackjackQueries.getSplitHandInfo, [gameId])
    ).rows;

    req.game.nextHand = splitHandInfo[0];

    next();
  } catch (error) {
    console.log(error);
    return next(
      new AppError("Failed to get blackjack hand", 400, "SERVER_ERROR")
    );
  }
};

module.exports = fetchHandData;
