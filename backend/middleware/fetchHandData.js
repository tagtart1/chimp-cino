const AppError = require("../utils/appError");
const pool = require("../db");
const blackjackQueries = require("../queries/blackjackQueries");

const fetchHandData = async (req, res, next) => {
  const gameId = req.game.id;

  try {
    const activeHand = (
      await pool.query(blackjackQueries.getHandData, [gameId, true])
    ).rows;

    req.game.activeHand = activeHand;

    const splitHandIds = (
      await pool.query(blackjackQueries.getSplitHandIds, [gameId])
    ).rows;

    req.game.nextHand = splitHandIds[0];

    next();
  } catch (error) {
    console.log(error);
    return next(
      new AppError("Failed to get blackjack hand", 400, "SERVER_ERROR")
    );
  }
};

module.exports = fetchHandData;
