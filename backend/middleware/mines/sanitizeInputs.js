const AppError = require("../../utils/appError");

const sanitizeInput = (req, res, next) => {
  const minMines = 1;
  const maxMines = 24;
  const minBet = 1;
  const maxBetPrecision = 2;

  const mines = req.body.mines;
  const bet = req.body.bet;

  if (typeof bet !== "number" || isNaN(bet) || !isFinite(bet)) {
    throw new AppError("Bet must be a valid integer", 400, "INVALID_INPUT");
  }

  if (!bet || bet < minBet) {
    throw new AppError("Bet needs to be at least 1.00", 400, "INVALID_INPUT");
  }

  if (
    typeof mines !== "number" ||
    !Number.isInteger(mines) ||
    isNaN(mines) ||
    !isFinite(mines)
  ) {
    console.log(typeof mines !== "number");
    console.log(isNaN(mines));
    console.log(!isFinite(mines));
    console.log(!Number.isInteger(mines));

    throw new AppError("Mines must be a valid integer", 400, "INVALID_INPUT");
  }

  if (!mines || mines < minMines || mines > maxMines) {
    throw new AppError(
      "Mines cannot exceed 24 or less than 1",
      401,
      "INVALID_INPUT"
    );
  }

  // Change the bet
  req.body.bet = parseFloat(req.body.bet.toFixed(maxBetPrecision));
  next();
};

module.exports = sanitizeInput;
