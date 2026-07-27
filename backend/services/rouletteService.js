import AppError from "../utils/appError.js";
import secureRandomNumber from "../utils/secureRandomNumber.js";

export function createRouletteService(store) {
  return {
    async play({ userId, totalBet, betMap }) {
      return store.transaction(async (transaction) => {
        const balance = await transaction.wallet.withdrawIfSufficient(
          userId,
          totalBet
        );
        if (balance == null) {
          throw new AppError(
            "Could not place bet: Insufficient funds",
            401,
            "INVALID_BET"
          );
        }

        const winningNum = secureRandomNumber(0, 36);
        const pocketBet = Number(betMap[winningNum] || 0);
        const newBalance = pocketBet
          ? await transaction.wallet.credit(userId, pocketBet * 36)
          : balance;

        return {
          data: {
            newBalance: { balance: newBalance },
            winningNum,
          },
        };
      });
    },
  };
}
