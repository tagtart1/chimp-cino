import assert from "node:assert/strict";
import test from "node:test";
import { createBlackjackService } from "../blackjackService.js";
import { createMinesService } from "../minesService.js";
import { createRouletteService } from "../rouletteService.js";
import { GAME_TYPES } from "../../config/gameTypes.js";

function analyticsCapture(calls) {
  return {
    async recordGameResult(input) {
      calls.push({ method: "recordGameResult", ...input });
    },
  };
}

function capturedSettlement(calls) {
  const settlements = calls.filter(
    (call) => call.method === "recordGameResult"
  );
  assert.equal(settlements.length, 1);
  return settlements[0];
}

test("roulette records both losing and paying spins", async () => {
  for (const winningSpin of [false, true]) {
    const calls = [];
    const store = {
      transaction: async (work) => work(store),
      wallet: {
        async withdrawIfSufficient() {
          return 1_000;
        },
        async credit(userId, amount) {
          calls.push({ method: "credit", userId, amount });
          return 1_000 + amount;
        },
      },
      analytics: analyticsCapture(calls),
    };
    const betMap = winningSpin
      ? Object.fromEntries(
          Array.from({ length: 37 }, (_, number) => [number, 1])
        )
      : {};

    await createRouletteService(store).play({
      userId: 7,
      totalBet: winningSpin ? 37 : 10,
      betMap,
    });

    const settlement = capturedSettlement(calls);
    assert.equal(settlement.gameType, GAME_TYPES.roulette);
    assert.equal(settlement.wagered, winningSpin ? 37 : 10);
    assert.equal(settlement.payout, winningSpin ? 36 : 0);
  }
});

function mineCells({ bombAt = 0, revealed = [] } = {}) {
  return Array.from({ length: 25 }, (_, field) => ({
    field,
    isGem: field !== bombAt,
    isRevealed: revealed.includes(field),
  }));
}

function createMinesStore(game) {
  const calls = [];
  const store = {
    transaction: async (work) => work(store),
    wallet: {
      async credit(userId, amount) {
        calls.push({ method: "credit", userId, amount });
      },
    },
    mines: {
      async findGameByUserId() {
        return game;
      },
      async deleteGame(gameId) {
        calls.push({ method: "deleteGame", gameId });
      },
      async revealCells() {},
      async updateMultiplier() {},
    },
    analytics: analyticsCapture(calls),
  };
  return { calls, store };
}

test("mines records an explosion with zero payout", async () => {
  const game = {
    id: 1,
    userId: 7,
    bet: 20,
    multiplier: 1,
    cells: mineCells({ bombAt: 0 }),
  };
  const { calls, store } = createMinesStore(game);

  await createMinesService(store).reveal({ userId: 7, fields: [0] });

  const settlement = capturedSettlement(calls);
  assert.equal(settlement.gameType, GAME_TYPES.mines);
  assert.equal(settlement.wagered, 20);
  assert.equal(settlement.payout, 0);
});

test("mines records manual and automatic cashouts", async () => {
  const manualGame = {
    id: 1,
    userId: 7,
    bet: 20,
    multiplier: 2.5,
    cells: mineCells({ bombAt: 24, revealed: [0] }),
  };
  const manual = createMinesStore(manualGame);
  await createMinesService(manual.store).cashout(7);
  assert.equal(capturedSettlement(manual.calls).payout, 50);

  const revealed = Array.from({ length: 23 }, (_, field) => field);
  const automaticGame = {
    id: 2,
    userId: 7,
    bet: 10,
    multiplier: 1.5,
    cells: mineCells({ bombAt: 24, revealed }),
  };
  const automatic = createMinesStore(automaticGame);
  await createMinesService(automatic.store).reveal({
    userId: 7,
    fields: [23],
  });
  assert.ok(capturedSettlement(automatic.calls).payout > 15);
});

const card = (id, rank, value, sequence) => ({
  id,
  suit: "S",
  rank,
  value,
  sequence,
});

const catalog = (rank, value) =>
  Array.from({ length: 52 }, (_, index) =>
    card(index + 1, rank, value)
  );

function activeBlackjackGame({
  playerCards,
  dealerCards,
  totalWagered = 10,
  offerInsurance = false,
}) {
  return {
    id: 1,
    userId: 7,
    startBet: 10,
    totalWagered,
    isGameOver: false,
    offerInsurance,
    hands: [
      {
        id: 11,
        isPlayer: true,
        isSelected: true,
        isCompleted: false,
        isBust: false,
        bet: 10,
        cards: playerCards,
      },
      {
        id: 12,
        isPlayer: false,
        isSelected: true,
        isCompleted: false,
        isBust: false,
        bet: 0,
        cards: dealerCards,
      },
    ],
  };
}

function createBlackjackStore(game, cardCatalog) {
  const calls = [];
  let nextHandId = 20;
  const store = {
    transaction: async (work) => work(store),
    wallet: {
      async withdrawIfSufficient(userId, amount) {
        calls.push({ method: "withdrawIfSufficient", userId, amount });
        return 1_000;
      },
      async credit(userId, amount) {
        calls.push({ method: "credit", userId, amount });
      },
    },
    blackjack: {
      async listCanonicalCards() {
        return cardCatalog;
      },
      async findGameByUserId() {
        return game;
      },
      async findGameStatusByUserId() {
        return null;
      },
      async createGame({ userId, bet }) {
        game = activeBlackjackGame({
          playerCards: [],
          dealerCards: [],
          totalWagered: bet,
        });
        game.userId = userId;
        game.startBet = bet;
        game.hands[0].bet = bet;
        return game;
      },
      async addCardsToHands(cards) {
        return cards.length;
      },
      async setGameOver() {
        game.isGameOver = true;
      },
      async setOfferInsurance(gameId, value) {
        game.offerInsurance = value;
        calls.push({ method: "setOfferInsurance", gameId, value });
      },
      async incrementTotalWagered(gameId, amount) {
        calls.push({ method: "incrementTotalWagered", gameId, amount });
      },
      async doubleHandBet() {},
      async countPlayerHands() {
        return game.hands.filter((hand) => hand.isPlayer).length;
      },
      async removeCardFromHand(handId, sequence) {
        return {
          cardId: game.hands[0].cards[sequence - 1].id,
          sequence,
        };
      },
      async createHand({ isPlayer, isSelected, bet }) {
        return {
          id: nextHandId++,
          isPlayer,
          isSelected,
          isCompleted: false,
          isBust: false,
          bet,
          cards: [],
        };
      },
      async updateHand(handId, changes) {
        Object.assign(
          game.hands.find((hand) => hand.id === handId),
          changes
        );
      },
      async deleteGame() {},
    },
    analytics: analyticsCapture(calls),
  };
  return { calls, store, getGame: () => game };
}

test("blackjack records an immediate natural settlement", async () => {
  const setup = createBlackjackStore(null, catalog("X", 10.5));

  await createBlackjackService(setup.store).newGame({
    userId: 7,
    betAmount: 10,
  });

  const settlement = capturedSettlement(setup.calls);
  assert.equal(settlement.gameType, GAME_TYPES.blackjack);
  assert.equal(settlement.wagered, 10);
  assert.equal(settlement.payout, 10);
});

test("blackjack records hit, stand, and double terminal settlements", async () => {
  const actions = [
    {
      name: "hit",
      catalog: catalog("2", 2),
      expectedWager: 10,
      expectedPayout: 0,
    },
    {
      name: "stand",
      catalog: catalog("10", 10),
      expectedWager: 10,
      expectedPayout: 10,
    },
    {
      name: "double",
      catalog: catalog("2", 2),
      expectedWager: 20,
      expectedPayout: 0,
    },
  ];

  for (const action of actions) {
    const game = activeBlackjackGame({
      playerCards: [card(1, "10", 10, 1), card(2, "10", 10, 2)],
      dealerCards: [card(3, "10", 10, 1), card(4, "10", 10, 2)],
    });
    const setup = createBlackjackStore(game, action.catalog);
    await createBlackjackService(setup.store)[action.name](7);

    const settlement = capturedSettlement(setup.calls);
    assert.equal(settlement.wagered, action.expectedWager, action.name);
    assert.equal(settlement.payout, action.expectedPayout, action.name);
  }
});

test("blackjack split records both stakes when both hands settle", async () => {
  const game = activeBlackjackGame({
    playerCards: [card(1, "A", 11, 1), card(2, "A", 11, 2)],
    dealerCards: [card(3, "10", 10, 1), card(4, "10", 10, 2)],
  });
  const setup = createBlackjackStore(game, catalog("K", 10));

  await createBlackjackService(setup.store).split(7);

  const settlement = capturedSettlement(setup.calls);
  assert.equal(settlement.wagered, 20);
  assert.equal(settlement.payout, 40);
  assert.ok(
    setup.calls.some(
      (call) =>
        call.method === "incrementTotalWagered" && call.amount === 10
    )
  );
});

test("paid blackjack insurance is included in the eventual wager", async () => {
  const game = activeBlackjackGame({
    playerCards: [card(1, "10", 10, 1), card(2, "9", 9, 2)],
    dealerCards: [card(3, "A", 11, 1), card(4, "9", 9, 2)],
    offerInsurance: true,
  });
  const setup = createBlackjackStore(game, catalog("2", 2));
  const service = createBlackjackService(setup.store);

  await service.insurance({ userId: 7, acceptInsurance: true });
  assert.equal(
    setup.calls.filter((call) => call.method === "recordGameResult")
      .length,
    0
  );
  await service.stand(7);

  const settlement = capturedSettlement(setup.calls);
  assert.equal(settlement.wagered, 15);
  assert.equal(settlement.payout, 0);
});
