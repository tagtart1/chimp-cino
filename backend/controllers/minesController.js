const AppError = require("../utils/appError");
const pool = require("../db");

exports.newGame = async (req, res, next) => {
  // Begin ACID as events such as money balance checking occurs
  req.transaction.release();
  res.status(200).json({
    data: "Hello world",
  });
};
