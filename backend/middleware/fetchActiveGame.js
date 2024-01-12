const AppError = require("../utils/appError");
const pool = require("../db");
const blackjackQueries = require("../queries/blackjackQueries");

const fetchActiveGame = async (req, res, next) => {
  const userID = req.user.id;

  try {
    const game = (
      await pool.query(blackjackQueries.findInProgressGame, [userID])
    ).rows[0];

    // Check if game exists
    if (!game) {
      next(new AppError("Game not found!", 400, "INVALID_SESSION"));
    }

    // Check if game is over then dont perform any actions
    if (game.is_game_over) {
      next(new AppError("Game is already over!", 401, "INVALID_ACTION"));
    }

    req.game = game;
    next();
  } catch (err) {
    next(new AppError("Could not fetch game", 400, "INVALID_SESSION"));
  }
};

module.exports = fetchActiveGame;
