/// Usernames are case insensitive

const checkIfUserExists =
  "SELECT COUNT (*) FROM users WHERE LOWER(username) = LOWER($1) OR email = LOWER($2)";

const addNewUser =
  "INSERT INTO users (username, email, password, balance) VALUES ($1,$2,$3,$4) RETURNING *";

const getUserByUsernameOrEmail =
  "SELECT * FROM users WHERE username = $1 OR email = $1";

module.exports = {
  checkIfUserExists,
  addNewUser,
  getUserByUsernameOrEmail,
};
