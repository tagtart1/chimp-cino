const AppError = require("../utils/appError");
const pool = require("../db");

exports.newGame = async (req, res, next) => {
  const client = await pool.connect();
  // Begin ACID as events such as money balance checking occurs
  res.status(200).json({
    data: "Hello world",
  });
};
