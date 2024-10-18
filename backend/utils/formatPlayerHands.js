const formatPlayerHands = (handCards) => {
  let playerHandData = {
    selectedHand: {
      handId: "",
      cards: [],
    },
    splitHand: [],
  };

  for (const card of handCards) {
    if (card.is_selected) {
      playerHandData.selectedHand.handId = card.hand_id;

      playerHandData.selectedHand.cards.push(card);
    }
  }
};

module.exports = formatPlayerHands;
