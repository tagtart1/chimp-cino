const AppError = require("../utils/appError");

const validateBetMap = (req, res, next) => {
  const betMap = req.body.betMap;
  let totalBetAmount = 0;
  // Check if empty
  if (Object.keys(betMap).length === 0) {
    throw new AppError("No bets placed!", 401, "INVALID_BET");
  }

  for (const pocket in betMap) {
    // Check for non ints
    if (isNaN(betMap[pocket])) {
      throw new AppError("Invalid bet amount", 401, "INVALID_BET");
    }
    // Check for negatives
    if (betMap[pocket] < 0) {
      throw new AppError("Invalid bet amount", 401, "INVALID_BET");
    }
    totalBetAmount += betMap[pocket];
  }

  req.totalBetAmount = totalBetAmount;
  next();
};

module.exports = validateBetMap;
