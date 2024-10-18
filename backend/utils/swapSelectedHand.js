const blackjackQueries = require("../queries/blackjackQueries");
const AppError = require("../utils/appError");

const swapSelectedHand = async (client, currentHandId, nextHandId, isBust) => {
  try {
    // Deselecting a hand also completes the hand.
    await client.query(blackjackQueries.deselectHandWithChanges, [
      currentHandId,
      isBust,
    ]);
    await client.query(blackjackQueries.selectHand, [nextHandId]);
  } catch (err) {
    throw err;
  }
};

module.exports = swapSelectedHand;
