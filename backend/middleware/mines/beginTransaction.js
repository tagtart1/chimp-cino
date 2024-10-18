const { getPool } = require("../../db");
const AppError = require("../../utils/appError");

const beginTransaction = async (req, res, next) => {
  try {
    const pool = getPool();
    const transaction = await pool.connect();
    await transaction.query("BEGIN");
    req.transaction = transaction;
    next();
  } catch (error) {
    next(new AppError("Failed to complete action.", 400, "SERVER_ERROR"));
  }
};

module.exports = beginTransaction;
