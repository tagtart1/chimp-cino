const casinoQueries = require("../queries/casinoQueries");

const payoutPlayer = async (client, userId, winners, hands) => {
  let totalPayout = 0;
  // Handle payout if applicable

  for (let i = 0; i < winners.length; i++) {
    const bet = hands[i].bet;

    if (winners[i] === "push") {
      await client.query(casinoQueries.depositBalance, [bet, userId]);
      totalPayout += bet;
    } else if (winners[i] === "player") {
      const payout = bet * 2;
      await client.query(casinoQueries.depositBalance, [payout, userId]);
      totalPayout += payout;
    }
  }

  return totalPayout;
};

module.exports = payoutPlayer;
