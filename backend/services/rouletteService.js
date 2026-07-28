import AppError from "../utils/appError.js";
import secureRandomNumber from "../utils/secureRandomNumber.js";
import { GAME_TYPES } from "../config/gameTypes.js";

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
        const payout = pocketBet ? pocketBet * 36 : 0;
        const newBalance = payout
          ? await transaction.wallet.credit(userId, payout)
          : balance;

        await transaction.analytics.recordGameResult({
          userId,
          gameType: GAME_TYPES.roulette,
          wagered: totalBet,
          payout,
        });

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
