const withdrawBalance =
  "UPDATE users SET balance = balance - $1 WHERE id = $2 AND balance >= $1";

const depositBalance = "UPDATE users SET balance = balance + $1 WHERE id = $2";

const getBalance = "SELECT balance FROM users WHERE id = $1";

module.exports = {
  withdrawBalance,
  depositBalance,
  getBalance,
};
