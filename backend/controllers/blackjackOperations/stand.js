const {
  validateAceValue,
  checkForBust,
  checkFor21,
} = require("../../utils/deckChecks");
const dealerDrawFor17 = require("../../utils/dealerDrawFor17");
const AppError = require("../../utils/appError");
const blackjackQueries = require("../../queries/blackjackQueries");
const casinoQueries = require("../../queries/casinoQueries");

const stand = async (client, gameId, handData) => {
  let results = {
    data: {
      dealer: {},
      is_game_over: true,
    },
  };

  try {
    validateAceValue(handData);
    let playerTotal = handData.reduce((total, card) => total + card.value, 0);

    // Draw dealer cards
    const dealerDrawResults = await dealerDrawFor17(client, gameId);

    // Set game over in DB
    await client.query(blackjackQueries.setGameOver, [gameId]);

    // Determine winner
    // Check who wins
    console.log("Dealer Value:", dealerDrawResults.handValue);
    console.log("Player value:", playerTotal);
    if (dealerDrawResults.isBust || dealerDrawResults.handValue < playerTotal) {
      // Player wins
      results.data.game_winner = "player";
    } else if (dealerDrawResults.handValue === playerTotal) {
      results.data.game_winner = "push";
    } else if (
      !dealerDrawResults.isBust &&
      dealerDrawResults.handValue > playerTotal
    ) {
      results.data.game_winner = "dealer";
    }

    // Add dealer cards to returned data
    results.data.dealer = {
      cards: dealerDrawResults.cards,
    };
  } catch (error) {
    console.log(error);
    throw new AppError("Failed to stand on hand", 401, "SERVER_ERROR");
  }

  return results;
};

module.exports = stand;
