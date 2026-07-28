const getBlackjackActionState = ({
  gameInProgress,
  isPending,
  offerInsurance,
  playerHands,
  selectedHandIndex,
  balance,
  betAmount,
}) => {
  const activeHand = playerHands[selectedHandIndex] || [];
  const numericBalance = Number(balance);
  const numericBet = Number(betAmount);
  const hasFunds =
    Number.isFinite(numericBalance) &&
    Number.isFinite(numericBet) &&
    numericBet > 0 &&
    numericBalance >= numericBet;
  const canAct =
    Boolean(gameInProgress) &&
    !isPending &&
    !offerInsurance &&
    activeHand.length >= 2;

  return {
    canHit: canAct,
    canStand: canAct,
    canDouble: canAct && activeHand.length === 2 && hasFunds,
    canSplit:
      canAct &&
      playerHands.length === 1 &&
      activeHand.length === 2 &&
      activeHand[0]?.rank === activeHand[1]?.rank &&
      hasFunds,
    canInsurance:
      Boolean(gameInProgress) && !isPending && Boolean(offerInsurance),
  };
};

const hasLiveBlackjackHand = ({ gameOver, playerHands }) =>
  !gameOver && playerHands.some((hand) => hand.length > 0);

export { hasLiveBlackjackHand };
export default getBlackjackActionState;
