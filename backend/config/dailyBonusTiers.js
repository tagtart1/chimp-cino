export const DAILY_BONUS_TIERS = Object.freeze([
  { minimumStreak: 1, maximumPayout: 10_000 },
  { minimumStreak: 3, maximumPayout: 20_000 },
  { minimumStreak: 5, maximumPayout: 30_000 },
  { minimumStreak: 7, maximumPayout: 45_000 },
  { minimumStreak: 10, maximumPayout: 100_000 },
]);

export const DAILY_BONUS_RARITIES = Object.freeze([
  { rarity: "GOLD", maximumRoll: 2, payoutMultiplier: 1 },
  { rarity: "RED", maximumRoll: 7, payoutMultiplier: 0.85 },
  { rarity: "PINK", maximumRoll: 18, payoutMultiplier: 0.7 },
  { rarity: "PURPLE", maximumRoll: 45, payoutMultiplier: 0.55 },
  { rarity: "GREEN", maximumRoll: 100, payoutMultiplier: 0.25 },
]);

export function rewardForDailyBonusStreak(streak, rarityRoll) {
  const { maximumPayout } = DAILY_BONUS_TIERS.findLast(
    ({ minimumStreak }) => streak >= minimumStreak
  );
  const { rarity, payoutMultiplier } = DAILY_BONUS_RARITIES.find(
    ({ maximumRoll }) => rarityRoll <= maximumRoll
  );

  return {
    rarity,
    payout: Math.round(maximumPayout * payoutMultiplier),
  };
}
