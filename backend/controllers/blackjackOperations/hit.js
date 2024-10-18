const blackjackQueries = require("../../queries/blackjackQueries");
const AppError = require("../../utils/appError");
const pullCardFromDeck = require("../../utils/pullCardFromDeck");
const dealerDrawFor17 = require("../../utils/dealerDrawFor17");
const {
  validateAceValue,
  checkForBust,
  checkFor21,
} = require("../../utils/deckChecks");

// In charge of hitting a new card, and reporting back results
const hit = async (client, gameId, handData, rig) => {
  let formattedData = {
    data: {
      player: {
        cards: [],
      },
      is_game_over: false,
      game_winners: [],
    },
  };
  try {
    const playerHandId = handData.id;
    const newSequence = handData.cards[handData.cards.length - 1].sequence + 1;

    const newCard = await pullCardFromDeck(
      playerHandId,
      newSequence,
      client,
      gameId,
      rig
    );

    handData.cards.push(newCard);
    validateAceValue(handData.cards);

    formattedData.data.is_hand_bust = checkForBust(handData.cards);
    formattedData.data.is_21 = checkFor21(handData.cards);

    formattedData.data.player.cards = handData.cards;
  } catch (err) {
    console.log(err);

    return;
  }

  return formattedData;
};

module.exports = hit;
