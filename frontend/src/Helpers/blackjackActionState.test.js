import getBlackjackActionState, {
  hasLiveBlackjackHand,
} from "./blackjackActionState";

const baseState = {
  gameInProgress: true,
  isPending: false,
  offerInsurance: false,
  playerHands: [
    [
      { rank: "8", value: 8 },
      { rank: "8", value: 8 },
    ],
  ],
  selectedHandIndex: 0,
  balance: 100,
  betAmount: 10,
};

describe("getBlackjackActionState", () => {
  it("allows valid actions for a funded pair", () => {
    expect(getBlackjackActionState(baseState)).toEqual({
      canHit: true,
      canStand: true,
      canDouble: true,
      canSplit: true,
      canInsurance: false,
    });
  });

  it("blocks actions while a request or deal animation is pending", () => {
    expect(
      getBlackjackActionState({ ...baseState, isPending: true })
    ).toEqual({
      canHit: false,
      canStand: false,
      canDouble: false,
      canSplit: false,
      canInsurance: false,
    });
  });

  it("only allows split for an untouched pair with enough balance", () => {
    const nonPair = {
      ...baseState,
      playerHands: [[{ rank: "8" }, { rank: "9" }]],
    };
    const hitHand = {
      ...baseState,
      playerHands: [[{ rank: "8" }, { rank: "8" }, { rank: "2" }]],
    };

    expect(getBlackjackActionState(nonPair).canSplit).toBe(false);
    expect(getBlackjackActionState(hitHand).canSplit).toBe(false);
    expect(
      getBlackjackActionState({ ...baseState, balance: 5 }).canSplit
    ).toBe(false);
  });

  it("blocks regular actions until insurance is resolved", () => {
    expect(
      getBlackjackActionState({ ...baseState, offerInsurance: true })
    ).toEqual({
      canHit: false,
      canStand: false,
      canDouble: false,
      canSplit: false,
      canInsurance: true,
    });
  });

  it("keeps Play locked whenever a live hand is still displayed", () => {
    expect(
      hasLiveBlackjackHand({
        gameOver: false,
        playerHands: [[{ rank: "8" }, { rank: "9" }]],
      })
    ).toBe(true);
    expect(
      hasLiveBlackjackHand({
        gameOver: true,
        playerHands: [[{ rank: "8" }, { rank: "9" }]],
      })
    ).toBe(false);
    expect(
      hasLiveBlackjackHand({ gameOver: false, playerHands: [[]] })
    ).toBe(false);
  });
});
