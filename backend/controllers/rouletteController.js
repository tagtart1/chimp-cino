const asyncHandler = require("express-async-handler");
const secureRandomNumber = require("../utils/secureRandomNumber");
const AppError = require("../utils/appError");
const { getPool } = require("../db");
const casinoQueries = require("../queries/casinoQueries");

exports.playGame = asyncHandler(async (req, res, next) => {
  const totalBet = req.totalBetAmount;
  const betMap = req.body.betMap;
  const userID = req.user.id;
  let winningNumber;
  const pool = getPool();
  // START ACID
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const withdrawBet = await client.query(casinoQueries.withdrawBalance, [
      totalBet,
      userID,
    ]);

    if (withdrawBet.rowCount === 0) {
      throw new AppError(
        "Could not place bet: Insufficient funds",
        401,
        "INVALID_BET"
      );
    }

    // Calcuate winning number
    winningNumber = secureRandomNumber(0, 36);

    // IF the winning number is in the bet map, we win
    if (betMap[winningNumber]) {
      // Includes original bet on pocket + winnings
      const totalWinnings = betMap[winningNumber] * 35 + betMap[winningNumber];

      const deposit = await client.query(casinoQueries.depositBalance, [
        totalWinnings,
        userID,
      ]);

      if (deposit.rowCount === 0) {
        throw new AppError(
          "Could not place bet: Server Error",
          500,
          "CONNECTION_REFUSED"
        );
      }
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    console.log(error.message);
  } finally {
    client.release();
  }

  // Send back updated balance
  const newBalance = (await pool.query(casinoQueries.getBalance, [userID]))
    .rows[0];

  res.json({
    data: {
      newBalance: newBalance,
      winningNum: winningNumber,
    },
  });

  // Deduct bet from balance
  // If win, find winning number in betmap, multiply by 35/36x and then that is your winnings
  // If win, we add winnings + original bet to balance

  // If lose, we just return the balance that has been already deducted
  // Return new balance
});
