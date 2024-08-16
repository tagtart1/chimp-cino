const AppError = require("../utils/appError");
const pool = require("../db");
const minesQueries = require("../queries/minesQueries");

exports.newGame = async (req, res, next) => {
  const transaction = req.transaction;
  const mines = req.body.mines;
  const userId = req.user.id;
  try {
    // Check if an in progress game exists
    const activeGame = (await transaction.query(minesQueries.getGame, [userId]))
      .rows[0];
    console.log(activeGame);
    if (activeGame) {
      throw new AppError("Game already in progress!", 401, "INVALID_ACTION");
    }
    // Create the game row in db and return the grid ID

    // Create the game array

    // Randomly select X amount of unique indexes to be mines

    await transaction.query("COMMIT");
    res.status(200).json({
      data: "Hello world",
    });
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError("Could not start game", 400, "SERVER_ERROR"));
    }
    await transaction.query("ROLLBACK");
  } finally {
    transaction.release();
  }
};

exports.getGame = async (req, res, next) => {};
