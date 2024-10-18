const blackjackQueries = require("../queries/blackjackQueries");
const { getPool } = require("../db");
const AppError = require("../utils/appError");

const fetchDealerHandData = async (req, res, next) => {
  const gameId = req.game.id;
  const pool = getPool();
  try {
    const dealerHandData = (
      await pool.query(blackjackQueries.getHandData, [gameId, false])
    ).rows;

    let dealerHandFormatted = {
      cards: dealerHandData.map((row) => ({
        suit: row.suit,
        rank: row.rank,
        value: row.value,
        sequence: row.sequence,
      })),
    };

    req.game.dealerHand = dealerHandFormatted;
    next();
  } catch (error) {
    console.log(error);
    return next(
      new AppError("Failed to get blackjack hand", 400, "SERVER_ERROR")
    );
  }
};

module.exports = fetchDealerHandData;
