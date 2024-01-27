const casinoQueries = require("../queries/casinoQueries");

const payoutPlayer = async (client, userId, winners, bet) => {
  let totalPayout = 0;
  // Handle payout if applicable
  for (const winner of winners) {
    if (winner === "push") {
      await client.query(casinoQueries.depositBalance, [bet, userId]);
      totalPayout += bet;
    } else if (winner === "player") {
      const payout = bet * 2;
      await client.query(casinoQueries.depositBalance, [payout, userId]);
      totalPayout += payout;
    }
  }

  return totalPayout;
};

module.exports = payoutPlayer;
