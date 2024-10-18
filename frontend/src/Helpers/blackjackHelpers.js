// Use this to delay actions for animation to run smooth
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Checks if a hand is soft with ace
const isHandSoft = (cards) => {
  let hasAce = false;
  let totalValue = 0;
  for (const card of cards) {
    totalValue += card.value || 0;

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

const getCardValueFromArray = (cards) => {
  let total = 0;
  let aceCount = 0;

  validateAceValue(cards);
  const isSoft = isHandSoft(cards);

  for (const card of cards) {
    // checking for null card catches the last null in array if there is
    total += card.value || 0;
    if (card.rank === "A") aceCount++;
  }
  if (cards.length === 1 && aceCount === 0) {
    return total;
  }
  if (cards.length === 1 && aceCount === 1 && isSoft) {
    return `1, 11`;
  }
  if (isSoft && aceCount > 0) {
    return `${total - 10}, ${total}`;
  }
  return total;
};

const validateAceValue = (cards, isDealer) => {
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

module.exports = {
  delay,
  isHandSoft,
  getCardValueFromArray,
};
