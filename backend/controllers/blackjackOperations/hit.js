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
      player: null,
      is_game_over: false,
    },
  };
  try {
    const playerHandId = handData[0].hand_id;
    const newSequence = handData[handData.length - 1].sequence + 1;

    const playerHandFormatted = {
      cards: handData.map((row) => ({
        suit: row.suit,
        rank: row.rank,
        value: row.value,

        sequence: row.sequence,
      })),
    };

    const newCard = await pullCardFromDeck(
      playerHandId,
      newSequence,
      client,
      gameId,
      rig
    );

    playerHandFormatted.cards.push(newCard);
    validateAceValue(playerHandFormatted.cards);

    formattedData.data.is_hand_bust = checkForBust(playerHandFormatted.cards);
    // TODO: remove the checkfor21 outsite of this.
    formattedData.data.is_21 = checkFor21(playerHandFormatted.cards);

    formattedData.data.player = playerHandFormatted;
  } catch (err) {
    console.log(err);

    return;
  }

  return formattedData;
};

module.exports = hit;
