const AppError = require("../../utils/appError");
const pool = require("../../db");
const minesQueries = require("../../queries/minesQueries");

const fetchActiveGame = async (req, res, next) => {
  const userId = req.user.id;

  try {
    const game = (await pool.query(minesQueries.getGame, [userId])).rows[0];
    if (!game) {
      throw new AppError("Game not found.", 404, "NOT_FOUND");
    }

    req.game = game;
    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else next(new AppError("Error fetching game", 500, "SERVER_ERROR"));
  }
};

module.exports = fetchActiveGame;
