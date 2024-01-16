const {
  validateAceValue,
  checkForBust,
  checkFor21,
} = require("../../utils/deckChecks");
const dealerDrawFor17 = require("../../utils/dealerDrawFor17");
const AppError = require("../../utils/appError");
const blackjackQueries = require("../../queries/blackjackQueries");
const casinoQueries = require("../../queries/casinoQueries");

const stand = async (client, gameId, playerHandsInfo) => {
  let results = {
    data: {
      dealer: {},
      is_game_over: true,
      game_winners: [],
    },
  };
  // Determin the order in which to determine winners
  playerHandsInfo.sort((a, b) => b.id - a.id);

  try {
    // Set game over in DB
    await client.query(blackjackQueries.setGameOver, [gameId]);

    // Draw dealer cards
    const dealerDrawResults = await dealerDrawFor17(client, gameId);

    // Handle player hand winners and losers

    for (const hand of playerHandsInfo) {
      validateAceValue(hand.cards);
      const handTotal = hand.cards.reduce(
        (total, card) => total + card.value,
        0
      );

      if (
        (dealerDrawResults.isBust || dealerDrawResults.handValue < handTotal) &&
        !hand.is_bust
      ) {
        // Player wins

        results.data.game_winners.push("player");
      } else if (dealerDrawResults.handValue === handTotal) {
        results.data.game_winners.push("push");
      } else if (
        (!dealerDrawResults.isBust &&
          dealerDrawResults.handValue > handTotal) ||
        hand.is_bust
      ) {
        results.data.game_winners.push("dealer");
      }
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
