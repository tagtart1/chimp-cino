const getGame = "SELECT * FROM active_mines_games WHERE user_id = $1 ";

const fetchGameCells =
  "SELECT is_revealed FROM active_cells WHERE game_id = $1 ORDERBY field ASC";

const createGame =
  "INSERT INTO active_mines_games (user_id, bet) VALUES ($1, $2) RETURNING id";

module.exports = {
  createGame,
  getGame,
};
