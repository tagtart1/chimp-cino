const buildDeckQuery = (gameId, NUMBER_OF_DECKS) => {
  const values = [];
  let placeholders = [];
  const amountOfCards = NUMBER_OF_DECKS * 52;
  let placeholderIndex = 1;

  for (let i = 1; i <= amountOfCards; i++) {
    const cardId = ((i - 1) % 52) + 1;

    values.push(gameId, cardId);
    placeholders.push(`($${placeholderIndex}, $${placeholderIndex + 1})`);
    placeholderIndex += 2;
  }

  const queryText = `INSERT INTO deck_cards (game_id, card_id) VALUES ${placeholders.join(
    ", "
  )};`;

  return [queryText, values];
};

module.exports = buildDeckQuery;
