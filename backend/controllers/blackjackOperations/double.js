const blackjackQueries = require("../../queries/blackjackQueries");
const casinoQueries = require("../../queries/casinoQueries");
const AppError = require("../../utils/appError");
const pullCardFromDeck = require("../../utils/pullCardFromDeck");
const dealerDrawFor17 = require("../../utils/dealerDrawFor17");
const {
  validateAceValue,
  checkForBust,
  checkFor21,
} = require("../../utils/deckChecks");
const hit = require("./hit");
const stand = require("./stand");

const double = async (client, gameId, userID, handData) => {
  try {
    const withdrawBet = await client.query(casinoQueries.withdrawBalance, [
      handData.bet,
      userID,
    ]);

    if (withdrawBet.rowCount === 0) {
      throw new AppError(
        "Could not place bet: Insufficient funds",
        401,
        "INVALID_BET"
      );
    }

    // Check for 3 or more card
    if (handData.cards.length >= 3) {
      console.log("AYO ERROR OUT LOL");
      throw new AppError("Cannot double after hitting!", 401, "INVALID_ACTION");
    }
    // Increase hands bet
    await client.query(blackjackQueries.doubleHandBet, [handData.id]);

    // Hit
    const hitResults = await hit(client, gameId, handData);
    return hitResults;
  } catch (error) {
    throw error;
  }
};

module.exports = double;
