const findInProgressGame =
  "SELECT * FROM active_blackjack_games WHERE user_id = $1";

const createNewBlackjackGame = `WITH new_game AS (
    INSERT INTO active_blackjack_games (is_game_over, user_id)
    VALUES (FALSE, $1)  
    RETURNING id as game_id
    ),
    player_hand as (
      INSERT INTO active_hands (game_id, is_player, is_soft)
      SELECT game_id, TRUE, FALSE FROM new_game
      RETURNING id as player_hand_id
    ),
    dealer_hand as (
      INSERT INTO active_hands (game_id, is_player, is_soft)
      SELECT game_id, FALSE, FALSE FROM new_game
      RETURNING id as dealer_hand_id
    )
    SELECT new_game.game_id,
    player_hand.player_hand_id,
    dealer_hand.dealer_hand_id
    FROM new_game, player_hand, dealer_hand
     `;

const getActiveDeckCards =
  "SELECT c.rank, c.suit, c.value FROM deck_cards d JOIN cards c ON d.card_id = c.id WHERE d.game_id = $1 AND d.is_active = TRUE";

const setDeckCardToInactive =
  "UPDATE deck_cards SET is_active = false WHERE id = $1";

const addCardToHand =
  "INSERT INTO active_hand_cards (hand_id, card_id, sequence) VALUES ($1, $2, $3)";

const deleteGame = "DELETE FROM active_blackjack_games WHERE id = $1";

module.exports = {
  findInProgressGame,
  createNewBlackjackGame,
  getActiveDeckCards,
  setDeckCardToInactive,
  addCardToHand,
  deleteGame,
};
