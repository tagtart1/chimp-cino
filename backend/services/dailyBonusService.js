import AppError from "../utils/appError.js";
import { rewardForDailyBonusStreak } from "../config/dailyBonusTiers.js";
import secureRandomNumber from "../utils/secureRandomNumber.js";

const ONE_DAY_MS = 24 * 60 * 60 * 1_000;

const utcDate = (date) =>
  new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );

export function createDailyBonusService(
  store,
  {
    now = () => new Date(),
    rollRarity = () => secureRandomNumber(1, 100),
  } = {}
) {
  return {
    async claim(userId) {
      return store.transaction(async (transaction) => {
        const bonus = await transaction.users.findStateById(userId);
        if (!bonus) {
          throw new AppError("User not found", 404, "NOT_FOUND");
        }

        const claimedOn = utcDate(now());
        const daysSinceLastClaim = bonus.lastDailyBonusClaimedOn
          ? (claimedOn - utcDate(bonus.lastDailyBonusClaimedOn)) / ONE_DAY_MS
          : null;

        if (daysSinceLastClaim === 0) {
          throw new AppError(
            "Daily bonus already claimed",
            409,
            "DAILY_BONUS_ALREADY_CLAIMED"
          );
        }

        const streak =
          daysSinceLastClaim === 1 ? bonus.dailyBonusStreak + 1 : 1;
        const { rarity, payout } = rewardForDailyBonusStreak(
          streak,
          rollRarity()
        );
        const updated = await transaction.users.claimDailyBonus({
          userId,
          streak,
          payout,
          claimedOn,
        });

        return {
          data: {
            rarity,
            payout,
            dailyBonusStreak: streak,
            lastDailyBonusClaimedOn: claimedOn,
            balance: updated.balance,
          },
        };
      });
    },

    async resetForTesting(userId) {
      if (process.env.NODE_ENV === "production") {
        throw new AppError("Not found", 404, "NOT_FOUND");
      }

      return { data: await store.users.resetDailyBonusForTesting(userId) };
    },
  };
}
