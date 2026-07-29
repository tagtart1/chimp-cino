export const REEL_LENGTH = 48;
export const WINNER_INDEX = 42;

const VISUAL_RARITIES = [
  { rarity: "GREEN", weight: 79.92 },
  { rarity: "PURPLE", weight: 15.98 },
  { rarity: "PINK", weight: 3.2 },
  { rarity: "RED", weight: 0.64 },
];

const TOTAL_VISUAL_WEIGHT = VISUAL_RARITIES.reduce(
  (total, { weight }) => total + weight,
  0
);

const rollVisualRarity = (random) => {
  const roll = random() * TOTAL_VISUAL_WEIGHT;
  let cumulativeWeight = 0;

  for (const { rarity, weight } of VISUAL_RARITIES) {
    cumulativeWeight += weight;
    if (roll < cumulativeWeight) return rarity;
  }

  return VISUAL_RARITIES.at(-1).rarity;
};

export function createDailyBonusReel(winnerRarity, random = Math.random) {
  const reel = Array.from({ length: REEL_LENGTH }, (_, index) => ({
    id: `${index}-${random()}`,
    rarity: rollVisualRarity(random),
    isWinner: false,
  }));

  reel[WINNER_INDEX] = {
    ...reel[WINNER_INDEX],
    rarity: winnerRarity,
    isWinner: true,
  };

  return reel;
}
