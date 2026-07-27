import assert from "node:assert/strict";
import test from "node:test";
import { createBlackjackService } from "../blackjackService.js";

const cardCatalog = Array.from({ length: 52 }, (_, index) => ({
  id: index + 1,
  rank: "2",
  suit: "S",
  value: 2,
}));

function createStore() {
  const calls = [];
  let nextGameId = 1;

  const store = {
    transaction: async (work) => work(store),
    wallet: {
      async withdrawIfSufficient(userId, bet) {
        calls.push({ method: "withdrawIfSufficient", userId, bet });
        return 1_000 - bet;
      },
      async credit() {
        calls.push({ method: "credit" });
      },
    },
    blackjack: {
      async listCanonicalCards() {
        calls.push({ method: "listCanonicalCards" });
        return cardCatalog;
      },
      async findGameStatusByUserId(userId) {
        calls.push({ method: "findGameStatusByUserId", userId });
        return null;
      },
      async createGame({ userId, bet }) {
        calls.push({ method: "createGame", userId, bet });
        const gameId = nextGameId++;
        return {
          id: gameId,
          userId,
          startBet: bet,
          isGameOver: false,
          offerInsurance: false,
          hands: [
            {
              id: gameId * 10 + 1,
              isPlayer: true,
              isSelected: true,
              isCompleted: false,
              isBust: false,
              bet,
              cards: [],
            },
            {
              id: gameId * 10 + 2,
              isPlayer: false,
              isSelected: true,
              isCompleted: false,
              isBust: false,
              bet: 0,
              cards: [],
            },
          ],
        };
      },
      async addCardsToHands(cards) {
        calls.push({ method: "addCardsToHands", cards });
        return cards.length;
      },
      async setOfferInsurance() {
        calls.push({ method: "setOfferInsurance" });
      },
      async setGameOver() {
        calls.push({ method: "setGameOver" });
      },
      async deleteGame() {
        calls.push({ method: "deleteGame" });
      },
    },
  };

  return { calls, store };
}

test("newGame caches the catalog and bulk-inserts each initial deal", async () => {
  const { calls, store } = createStore();
  const service = createBlackjackService(store);

  const first = await service.newGame({ userId: 7, betAmount: 10 });
  const second = await service.newGame({ userId: 8, betAmount: 20 });

  assert.equal(
    calls.filter((call) => call.method === "listCanonicalCards").length,
    1
  );
  assert.equal(
    calls.filter((call) => call.method === "findGameStatusByUserId").length,
    2
  );
  assert.equal(
    calls.filter((call) => call.method === "createGame").length,
    2
  );

  const deals = calls.filter((call) => call.method === "addCardsToHands");
  assert.equal(deals.length, 2);
  for (const deal of deals) {
    assert.equal(deal.cards.length, 4);
    assert.deepEqual(
      deal.cards.map(({ handId, sequence }) => ({ handId, sequence })),
      [
        { handId: deal.cards[0].handId, sequence: 1 },
        { handId: deal.cards[1].handId, sequence: 1 },
        { handId: deal.cards[0].handId, sequence: 2 },
        { handId: deal.cards[1].handId, sequence: 2 },
      ]
    );

    const copiesByCard = new Map();
    for (const card of deal.cards) {
      copiesByCard.set(card.cardId, (copiesByCard.get(card.cardId) || 0) + 1);
    }
    assert.ok([...copiesByCard.values()].every((count) => count <= 2));
  }

  assert.equal(first.data.player.hands[0].length, 2);
  assert.equal(first.data.dealer.cards.length, 1);
  assert.equal(second.data.player.hands[0].length, 2);
  assert.equal(second.data.dealer.cards.length, 1);
});

test("newGame rejects an incomplete canonical card catalog", async () => {
  const { store } = createStore();
  store.blackjack.listCanonicalCards = async () => cardCatalog.slice(0, 51);
  const service = createBlackjackService(store);

  await assert.rejects(
    service.newGame({ userId: 7, betAmount: 10 }),
    (error) =>
      error.code === "SERVER_ERROR" &&
      error.message === "Blackjack card catalog must contain 52 cards"
  );
});
