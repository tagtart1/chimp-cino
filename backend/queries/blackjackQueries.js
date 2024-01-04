const findInProgressGame =
  "SELECT * FROM active_blackjack_games WHERE user_id = $1";

const getHandData = `
    SELECT c.suit, c.rank, c.value, ahc.sequence, ahc.hand_id
    FROM active_hands AS ah
    JOIN active_hand_cards AS ahc ON ah.id = ahc.hand_id
    JOIN cards as c ON ahc.card_id = c.id
    WHERE ah.game_id = $1 AND ah.is_player = $2
    ORDER BY ah.id, ahc.sequence;
  `;

const createNewBlackjackGame = `WITH new_game AS (
    INSERT INTO active_blackjack_games (is_game_over, user_id, bet)
    VALUES (FALSE, $1, $2)  
    RETURNING id as game_id
    ),
    player_hand as (
      INSERT INTO active_hands (game_id, is_player, is_selected)
      SELECT game_id, TRUE, TRUE FROM new_game
      RETURNING id as player_hand_id
    ),
    dealer_hand as (
      INSERT INTO active_hands (game_id, is_player, is_selected)
      SELECT game_id, FALSE, TRUE FROM new_game
      RETURNING id as dealer_hand_id
    )
    SELECT new_game.game_id,
    player_hand.player_hand_id,
    dealer_hand.dealer_hand_id
    FROM new_game, player_hand, dealer_hand
     `;

const getActiveDeckCards =
  "SELECT c.rank, c.suit, c.value, c.id, d.id AS deck_card_id FROM deck_cards d JOIN cards c ON d.card_id = c.id WHERE d.game_id = $1 AND d.is_active = TRUE";

const setDeckCardToInactive =
  "UPDATE deck_cards SET is_active = false WHERE id = $1";

const addCardToHand =
  "INSERT INTO active_hand_cards (hand_id, card_id, sequence) VALUES ($1, $2, $3)";

const removeCardFromHand =
  "DELETE FROM active_hand_cards WHERE hand_id = $1 AND sequence = $2 RETURNING *";

const deleteGame = "DELETE FROM active_blackjack_games WHERE id = $1";

const setGameOver =
  "UPDATE active_blackjack_games SET is_game_over = true WHERE id =$1";

const getCountOfPlayerHands =
  "SELECT COUNT(*) FROM active_hands WHERE is_player = true AND game_id = $1";

const createNewHand =
  "INSERT INTO active_hands (game_id, is_player, is_selected) VALUES ($1,$2,$3) RETURNING id";

module.exports = {
  getHandData,
  findInProgressGame,
  createNewBlackjackGame,
  getActiveDeckCards,
  setDeckCardToInactive,
  addCardToHand,
  deleteGame,
  setGameOver,
  getCountOfPlayerHands,
  createNewHand,
  removeCardFromHand,
};
