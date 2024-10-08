const getGame = "SELECT * FROM active_mines_games WHERE user_id = $1 ";

const fetchGameCells =
  "SELECT is_gem, is_revealed FROM active_cells WHERE game_id = $1 ORDER BY field ASC";

const revealCells =
  "UPDATE active_cells SET is_revealed = true WHERE game_id = $1 and field = ANY($2::int[])";

const createGame =
  "INSERT INTO active_mines_games (user_id, bet, multiplier) VALUES ($1, $2, 1) RETURNING id";

const updateMultiplier =
  "UPDATE active_mines_games SET multiplier = $1 WHERE id =$2";

const deleteGame = "DELETE FROM active_mines_games WHERE id = $1";

module.exports = {
  createGame,
  getGame,
  fetchGameCells,
  revealCells,
  updateMultiplier,
  deleteGame,
};
