// Modifies the most recent ace to stay 11 or 1
const validateAceValue = (cards) => {
  let totalValue = 0;
  for (const card of cards) {
    totalValue += card.value;
    if (totalValue > 21) {
      const ace = cards.find((c) => c.rank === "A" && c.value === 11);
      if (ace) {
        ace.value = 1;
        totalValue -= 10;
      }
    }
  }
};

const checkFor21 = (cards) => {
  let totalValue = 0;
  for (const card of cards) {
    totalValue += card.value;
  }

  if (totalValue === 21) {
    // Game is bust, end game
    return true;
  } else return false;
};

const checkForBust = (cards) => {
  let totalValue = 0;
  for (const card of cards) {
    totalValue += card.value;
  }

  if (totalValue > 21) {
    // Game is bust, end game
    return true;
  } else return false;
};

const isBlackjack = (cards) => {
  let totalValue = 0;

  for (const card of cards) {
    totalValue += card.value;
  }

  if (totalValue === 21) return true;
  return false;
};

const isHandSoft = (cards) => {
  // Checks for ace
  let hasAce = false;
  let totalValue = 0;
  for (const card of cards) {
    totalValue += card.value;

    if (card.rank === "A" && card.value === 11) {
      hasAce = true;
    }
  }

  if (hasAce && totalValue < 21) {
    return true;
  } else {
    return false;
  }
};

module.exports = {
  validateAceValue,
  checkFor21,
  checkForBust,
  isBlackjack,
  isHandSoft,
};
