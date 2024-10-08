const AppError = require("../utils/appError");
const pool = require("../db");
const minesQueries = require("../queries/minesQueries");
const casinoQueries = require("../queries/casinoQueries");

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
    const game = req.game;
    const { id: gameId, bet, multiplier } = game;

    const cellRows = (await pool.query(minesQueries.fetchGameCells, [gameId]))
      .rows;

    const gameCells = [];
    let mineCount = 0;
    let gemCount = 0;
    for (let i = 0; i < cellRows.length; i++) {
      const currentCell = cellRows[i];
      if (!currentCell.is_gem) {
        mineCount++;
      }
      if (!currentCell.is_revealed) {
        gameCells.push(0);
        if (currentCell.is_gem) {
          gemCount++;
        }
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

exports.revealCell = async (req, res, next) => {
  const transaction = req.transaction;

  const fields = req.body.fields;
  let isGameOver = false;
  let multiplier = parseFloat(req.game.multiplier);
  let shouldReleaseTransaction = true;
  const { id: gameId } = req.game;
  try {
    // Fetch all the cell
    const allCells = (
      await transaction.query(minesQueries.fetchGameCells, [gameId])
    ).rows;

    for (const field of fields) {
      const selected = allCells[field];
      if (selected.is_revealed) {
        throw new AppError(
          "One or more of the cells you want to reveal have already been revealed",
          400,
          "INVALID_INPUT"
        );
      } else {
        selected.is_revealed = true;

        // One or more selected cells is a mine, end the game
        if (!selected.is_gem) {
          isGameOver = true;
        }
      }
    }

    req.game.allCells = allCells;

    // Reveal the cells
    // If the game is not over then update the db, if it is, then it will not matter, optimizing 101
    if (!isGameOver)
      await transaction.query(minesQueries.revealCells, [gameId, fields]);

    const gameCells = [];

    if (!isGameOver) {
      let hiddenCells = 0;
      let mineCount = 0;
      // Build the game array
      for (let i = 0; i < allCells.length; i++) {
        const cell = allCells[i];
        if (!cell.is_revealed) {
          gameCells.push(0);
          hiddenCells++;
          if (!cell.is_gem) mineCount++;
        } else {
          gameCells.push(1);
        }
      }

      // Calculate the new multiplier, +1 because we want the multipler before action was taken
      multiplier = calculateMultiplier(
        multiplier,
        mineCount,
        hiddenCells + fields.length,
        fields.length
      );
      req.game.multiplier = multiplier;

      if (mineCount / hiddenCells === 1) {
        // Last gem was revealed, cashout the user
        shouldReleaseTransaction = false;
        return next();
      }

      // Update the DB
      await transaction.query(minesQueries.updateMultiplier, [
        multiplier,
        gameId,
      ]);
    } else {
      // Build the game array
      for (let i = 0; i < allCells.length; i++) {
        const cell = allCells[i];
        if (cell.is_gem) {
          gameCells.push(1);
        } else {
          gameCells.push(2);
        }
      }
      // Delete the game since it is now over
      await transaction.query(minesQueries.deleteGame, [gameId]);
    }

    transaction.query("COMMIT");

    res.status(200).json({
      data: {
        isGameOver: isGameOver,
        cells: gameCells,
        multiplier: multiplier,
      },
    });
  } catch (error) {
    transaction.query("ROLLBACK");
    if (error instanceof AppError) {
      next(error);
    } else {
      console.log(error);
      next(new AppError("Server error", 500, "SERVER_ERROR"));
    }
  } finally {
    if (shouldReleaseTransaction) transaction.release();
  }
};

exports.cashout = async (req, res, next) => {
  const transaction = req.transaction;
  const multiplier = req.game.multiplier;
  const bet = req.game.bet;
  const userId = req.user.id;
  const revealedCells = [];
  try {
    // Ensure player is not cashing out with no multiplier
    if (multiplier <= 1) {
      throw new AppError(
        "You must first play before cashing out!",
        400,
        "INVALID_INPUT"
      );
    }
    // Payout the player
    let allCells = req.game.allCells;
    const winnings = bet * multiplier;
    await transaction.query(casinoQueries.depositBalance, [winnings, userId]);

    if (!allCells) {
      allCells = (
        await transaction.query(minesQueries.fetchGameCells, [req.game.id])
      ).rows;
    }
    // Build the revealed cells grid
    for (let i = 0; i < allCells.length; i++) {
      const cell = allCells[i];
      if (cell.is_gem) {
        revealedCells.push(1);
      } else {
        revealedCells.push(2);
      }
    }
    // Delete the game since it is now over
    await transaction.query(minesQueries.deleteGame, [req.game.id]);

    await transaction.query("COMMIT");
    res.status(200).json({
      data: {
        isGameOver: true,
        cells: revealedCells,
        multiplier: multiplier,
        payout: winnings,
      },
    });
  } catch (error) {
    transaction.query("ROLLBACK");
    if (error instanceof AppError) {
      next(error);
    } else {
      console.log(error);
      next(new AppError("Server error", 500, "SERVER_ERROR"));
    }
  } finally {
    transaction.release();
  }
};

const calculateMultiplier = (starterMulti, mines, unrevealed, newReveals) => {
  let currentMulti = starterMulti;

  for (let i = 0; i < newReveals; i++) {
    // Determine the tax for the current reveal
    const tax = unrevealed === 25 && i === 0 ? 0.99 : 1;

    currentMulti = currentMulti * (1 / (1 - mines / unrevealed)) * tax;
    unrevealed--;
  }

  return parseFloat(currentMulti.toFixed(6));
};
