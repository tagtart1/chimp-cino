const AppError = require("../utils/appError");
const pool = require("../db");
const minesQueries = require("../queries/minesQueries");

exports.newGame = async (req, res, next) => {
  const transaction = req.transaction;
  const mines = req.body.mines;
  const bet = req.body.bet;
  const userId = req.user.id;
  try {
    // Check if an in progress game exists
    const activeGame = (await transaction.query(minesQueries.getGame, [userId]))
      .rows[0];

    if (activeGame) {
      throw new AppError("Game already in progress!", 401, "INVALID_ACTION");
    }
    // Create the game row in db and return the grid ID
    const gameId = (
      await transaction.query(minesQueries.createGame, [userId, bet])
    ).rows[0];
    console.log(gameId);

    // Create the game array

    // Randomly select X amount of unique indexes to be mines

    await transaction.query("COMMIT");
    res.status(200).json({
      data: "Hello world",
    });
  } catch (error) {
    await transaction.query("ROLLBACK");
    if (error instanceof AppError) {
      next(error);
    } else {
      console.log(error);
      next(new AppError("Could not start game", 400, "SERVER_ERROR"));
    }
  } finally {
    transaction.release();
  }
};

exports.getGame = async (req, res, next) => {};
