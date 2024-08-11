const AppError = require("../utils/appError");
const pool = require("../db");

exports.newGame = async (req, res, next) => {
  res.status(200).json({
    data: "Hello world",
  });
};
