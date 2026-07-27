import { BLACKJACK_RULES } from "../config/blackjackRules.js";
import AppError from "../utils/appError.js";
import secureRandomNumber from "../utils/secureRandomNumber.js";

export function buildRemainingShoe(
  cardCatalog,
  hands,
  deckCount = BLACKJACK_RULES.deckCount
) {
  const dealtCounts = new Map();

  for (const hand of hands) {
    for (const card of hand.cards) {
      dealtCounts.set(card.id, (dealtCounts.get(card.id) || 0) + 1);
    }
  }

  const remainingShoe = [];
  for (const card of cardCatalog) {
    const remainingCopies = deckCount - (dealtCounts.get(card.id) || 0);
    if (remainingCopies < 0) {
      throw new AppError(
        "The persisted blackjack shoe is invalid",
        500,
        "SERVER_ERROR"
      );
    }
    for (let copy = 0; copy < remainingCopies; copy++) {
      remainingShoe.push(card);
    }
  }

  return remainingShoe;
}

export function drawRandomCard(remainingShoe) {
  if (remainingShoe.length === 0) {
    throw new AppError("Deck is empty", 400, "SERVER_ERROR");
  }

  const selectedIndex = secureRandomNumber(0, remainingShoe.length - 1);
  return remainingShoe.splice(selectedIndex, 1)[0];
}
