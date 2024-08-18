const getGame = "SELECT * FROM active_mines_games WHERE user_id = $1 ";

const fetchGameCells =
  "SELECT is_gem, is_revealed FROM active_cells WHERE game_id = $1 ORDER BY field ASC";

const createGame =
  "INSERT INTO active_mines_games (user_id, bet, multiplier) VALUES ($1, $2, 1) RETURNING id";

module.exports = {
  createGame,
  getGame,
  fetchGameCells,
};
