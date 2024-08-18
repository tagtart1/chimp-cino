const AppError = require("../utils/appError");
const pool = require("../db");
const minesQueries = require("../queries/minesQueries");

exports.newGame = async (req, res, next) => {
  const transaction = req.transaction;
  const mines = req.body.mines;
  const bet = req.body.bet;
  const userId = req.user.id;
  const gameSize = 25;
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
    ).rows[0].id;

    // Create the game array, all elements are true to resemble that they are a gem
    const gameArray = new Array(25).fill(true);
    const minesIndices = [];
    // Select locations for mines
    while (minesIndices.length < mines) {
      const randomIndex = Math.floor(Math.random() * 25);
      if (!minesIndices.includes(randomIndex)) {
        minesIndices.push(randomIndex);
        //Set that field to be a mine
        gameArray[randomIndex] = false;
      }
    }
    // Build cells query
    let insertCellsIntoDbQuery =
      "INSERT INTO active_cells (game_id, field, is_gem, is_revealed) VALUES";
    for (let index = 0; index < gameArray.length; index++) {
      insertCellsIntoDbQuery += ` (${gameId}, ${index}, ${gameArray[index]}, false),`;
    }
    // Remove the , at the end
    insertCellsIntoDbQuery = insertCellsIntoDbQuery.slice(0, -1);

    // Run query to create cells
    await transaction.query(insertCellsIntoDbQuery);

    await transaction.query("COMMIT");
    res.sendStatus(200);
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

exports.getGame = async (req, res, next) => {
  const userId = req.user.id;
  try {
    const game = (await pool.query(minesQueries.getGame, [userId])).rows[0];
    if (!game) {
      throw new AppError("Game not found.", 404, "NOT_FOUND");
    }
    const { id: gameId, bet, multiplier } = game;

    const cellRows = (await pool.query(minesQueries.fetchGameCells, [gameId]))
      .rows;

    const gameCells = [];
    let mineCount = 0;
    let gemCount = 0;
    for (let i = 0; i < cellRows.length; i++) {
      const currentCell = cellRows[i];
      if (currentCell.is_gem) {
        gemCount++;
      } else {
        mineCount++;
      }
      if (!currentCell.is_revealed) {
        gameCells.push(0);
      } else {
        // 1 resembles a gem, we assume this because the game would have been ended
        gameCells.push(1);
      }
    }

    res.status(200).json({
      data: {
        cells: gameCells,
        bet: bet,
        gems: gemCount,
        mines: mineCount,
        multiplier: multiplier,
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      console.log(error);
      next(new AppError("Could not fetch game", 500, "SERVER_ERROR"));
    }
  }
};

exports.revealCell = async (req, res, next) => {};
