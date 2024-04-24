const AppError = require("../utils/appError");

const validateInsurance = (req, res, next) => {
  const game = req.game;
  if (game.offer_insurance) {
    next(new AppError("Accept or deny insurance!", 401, "INVALID_ACTION"));
  }
};

module.exports = validateInsurance;
