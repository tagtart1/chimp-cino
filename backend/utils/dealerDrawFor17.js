const blackjackQueries = require("../queries/blackjackQueries");
const {
  validateAceValue,
  isHandSoft,
  checkForBust,
} = require("../utils/deckChecks");
const pullCardFromDeck = require("./pullCardFromDeck");

// Keeps drawing untill the dealer total is at 17 or higher;
const dealerDrawFor17 = async (client, gameId) => {
  // Grab dealer hand data and store for initial cards array
  // Start loop to pull cards from deck till dealer is above or at soft 17
  // In looop, pull card, then check if at or above 17
  // Return cards array and total value in seperate property
  // Use the value for determining win and the cards array to send back to client
  const dealerHandData = (
    await client.query(blackjackQueries.getHandData, [gameId, false])
  ).rows;
  const dealerHandId = dealerHandData[0].hand_id;

  let newSequence = dealerHandData.length + 1;

  let dealerHandFormatted = {
    cards: dealerHandData.map((row) => ({
      suit: row.suit,
      rank: row.rank,
      value: row.value,
      sequence: row.sequence,
    })),
  };

  validateAceValue(dealerHandFormatted.cards);
  let handValue = dealerHandFormatted.cards.reduce((value, card) => {
    return value + card.value;
  }, 0);
  while (handValue < 17) {
    const newCard = await pullCardFromDeck(
      dealerHandId,
      newSequence,
      client,
      gameId,
      23
    );

    dealerHandFormatted.cards.push(newCard);
    validateAceValue(dealerHandFormatted.cards, true);
    handValue = dealerHandFormatted.cards.reduce((value, card) => {
      return value + card.value;
    }, 0);
    newSequence++;
  }
  dealerHandFormatted.handValue = handValue;
  dealerHandFormatted.isSoft = isHandSoft(dealerHandFormatted.cards);
  dealerHandFormatted.isBust = checkForBust(dealerHandFormatted.cards);

  return dealerHandFormatted;
};

module.exports = dealerDrawFor17;
