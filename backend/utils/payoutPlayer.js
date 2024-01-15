const casinoQueries = require("../queries/casinoQueries");

// TODO: needs to be variable with multiple hands

const payoutPlayer = async (client, userId, winners, bet) => {
  let totalPayout = 0;
  // Handle payout if applicable
  if (winners[0] === "push") {
    await client.query(casinoQueries.depositBalance, [bet, userId]);
    totalPayout = bet;
  } else if (winners[0] === "player") {
    const payout = bet * 2;
    await client.query(casinoQueries.depositBalance, [payout, userId]);
    totalPayout = payout;
  }

  return totalPayout;
};

module.exports = payoutPlayer;
