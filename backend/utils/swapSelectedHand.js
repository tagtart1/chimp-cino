const blackjackQueries = require("../queries/blackjackQueries");
const AppError = require("../utils/appError");

const swapSelectedHand = async (client, currentHandId, nextHandId) => {
  try {
    // Deselecting a hand also completes the hand.
    await client.query(blackjackQueries.deselectHand, [currentHandId]);
    await client.query(blackjackQueries.selectHand, [nextHandId]);
  } catch {
    throw new AppError("Could not hit", 400, "SERVER_ERROR");
  }
};

module.exports = swapSelectedHand;
