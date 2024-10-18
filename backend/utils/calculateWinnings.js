const { validateAceValue } = require("./deckChecks");

const calculateWinnings = (dealerDrawResults, playerHands, bet) => {
  let results = {
    totalPayout: 0,
    winners: [],
  };

  if (dealerDrawResults.isBust) {
    results.totalPayout = bet * 2 * playerHands.length;
    results.winners = ["player", "player"];
    return results;
  }

  // Calculate each player hand totals
  for (const hand of playerHands) {
    let handTotal = 0;
    validateAceValue(hand);
    for (const card of hand) {
      handTotal += card.value;
    }

    if (dealerDrawResults.handValue < handTotal) {
      // Player wins
      results.totalPayout += bet * 2;
      results.winners.push("player");
    } else if (dealerDrawResults.handValue === handTotal) {
      results.totalPayout += bet;
      results.winners.push("push");
    } else if (dealerDrawResults.handValue > playerTotal) {
      results.winners.push("dealer");
    }
  }

  return results;
};

module.exports = calculateWinnings;
