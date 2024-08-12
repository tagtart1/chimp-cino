const AppError = require("../utils/appError");
const pool = require("../db");

exports.newGame = async (req, res, next) => {
  const transaction = req.transaction;
  // Begin ACID as events such as money balance checking occurs
  try {
    // Create a new game with grid
    await transaction.query("COMMIT");
    res.status(200).json({
      data: "Hello world",
    });
  } catch (error) {
    await transaction.query("ROLLBACK");
  } finally {
    transaction.release();
  }
};
