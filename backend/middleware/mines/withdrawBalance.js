const AppError = require("../../utils/appError");
const casinoQueries = require("../../queries/casinoQueries");
const withdrawBalance = async (req, res, next) => {
  const transaction = req.transaction;
  const bet = req.body.bet;
  const user = req.user;
  console.log(user);
  try {
    const withdrew = await transaction.query(casinoQueries.withdrawBalance, [
      bet,
      user.id,
    ]);
    if (withdrew.rowCount === 0) {
      next(
        new AppError("You are too broke to place this bet.", 400, "INVALID_BET")
      );
    }
  } catch (error) {
    await transaction.query("ROLLBACK");
    next(new AppError("Failed to start game", 401, "SERVER_ERROR"));
  } finally {
    next();
  }
};

module.exports = withdrawBalance;
