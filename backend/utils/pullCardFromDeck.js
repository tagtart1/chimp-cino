const secureRandomNumber = require("./secureRandomNumber");
const blackjackQueries = require("../queries/blackjackQueries");

// Conditionally render the deckId later
const pullCardFromDeck = async (handId, sequence, client, gameId, rig) => {
  const deckCards = (
    await client.query(blackjackQueries.getActiveDeckCards, [gameId])
  ).rows;

  const randomCardNumber = secureRandomNumber(0, deckCards.length - 1);

  const hitCard = rig ? pullCard(deckCards, rig) : deckCards[randomCardNumber];

  await client.query(blackjackQueries.setDeckCardToInactive, [
    hitCard.deck_card_id,
  ]);

  // Add card to hand
  await client.query(blackjackQueries.addCardToHand, [
    handId,
    hitCard.id,
    sequence,
  ]);

  return {
    id: hitCard.deck_card_id,
    rank: hitCard.rank,
    suit: hitCard.suit,
    value: hitCard.value,
    sequence,
  };
};

// Pull a specific card from a deck
const pullCard = (deckCards, id) => {
  for (const card of deckCards) {
    if (card.id === id) {
      return card;
    }
  }
};

module.exports = pullCardFromDeck;
