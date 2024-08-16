const getGame = "SELECT * FROM active_mines_games WHERE user_id = $1 ";

const createGame =
  "INSERT INTO active_mines_games (user_id, bet) VALUES ($1, $2) RETURNING id";

module.exports = {
  createGame,
  getGame,
};
