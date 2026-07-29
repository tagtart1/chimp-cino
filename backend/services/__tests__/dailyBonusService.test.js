import assert from "node:assert/strict";
import test from "node:test";
import { createDailyBonusService } from "../dailyBonusService.js";

function createStore({
  balance = 10_000,
  dailyBonusStreak = 0,
  lastDailyBonusClaimedOn = null,
} = {}) {
  const calls = [];
  const state = {
    balance,
    dailyBonusStreak,
    lastDailyBonusClaimedOn,
  };
  const store = {
    transaction: async (work) => work(store),
    users: {
      async findStateById() {
        return { ...state };
      },
      async claimDailyBonus(input) {
        calls.push(input);
        state.balance += input.payout;
        state.dailyBonusStreak = input.streak;
        state.lastDailyBonusClaimedOn = input.claimedOn;
        return { balance: state.balance };
      },
      async resetDailyBonusForTesting() {
        state.dailyBonusStreak = 0;
        state.lastDailyBonusClaimedOn = null;
        return {
          dailyBonusStreak: state.dailyBonusStreak,
          lastDailyBonusClaimedOn: state.lastDailyBonusClaimedOn,
        };
      },
    },
  };
  return { calls, state, store };
}

test("gold pays each streak maximum and keeps the best tier after day 10", async () => {
  const { state, store } = createStore();
  let currentDay = 1;
  const service = createDailyBonusService(store, {
    now: () =>
      new Date(
        `2026-07-${String(currentDay).padStart(2, "0")}T18:00:00Z`
      ),
    rollRarity: () => 1,
  });
  const expectedPayouts = [
    10_000, 10_000, 20_000, 20_000, 30_000, 30_000, 45_000, 45_000,
    45_000, 100_000, 100_000,
  ];

  for (const payout of expectedPayouts) {
    const result = await service.claim(7);
    assert.equal(result.data.rarity, "GOLD");
    assert.equal(result.data.payout, payout);
    assert.equal(result.data.dailyBonusStreak, currentDay);
    currentDay += 1;
  }

  assert.equal(state.dailyBonusStreak, 11);
  assert.equal(state.balance, 465_000);
});

test("rarity roll boundaries select the configured payout multiplier", async () => {
  const cases = [
    { roll: 1, rarity: "GOLD", payout: 20_000 },
    { roll: 2, rarity: "GOLD", payout: 20_000 },
    { roll: 3, rarity: "RED", payout: 17_000 },
    { roll: 7, rarity: "RED", payout: 17_000 },
    { roll: 8, rarity: "PINK", payout: 14_000 },
    { roll: 18, rarity: "PINK", payout: 14_000 },
    { roll: 19, rarity: "PURPLE", payout: 11_000 },
    { roll: 45, rarity: "PURPLE", payout: 11_000 },
    { roll: 46, rarity: "GREEN", payout: 5_000 },
    { roll: 100, rarity: "GREEN", payout: 5_000 },
  ];

  for (const expected of cases) {
    const { calls, store } = createStore({
      dailyBonusStreak: 3,
      lastDailyBonusClaimedOn: new Date("2026-07-27T00:00:00Z"),
    });
    const result = await createDailyBonusService(store, {
      now: () => new Date("2026-07-28T12:00:00Z"),
      rollRarity: () => expected.roll,
    }).claim(7);

    assert.equal(result.data.rarity, expected.rarity);
    assert.equal(result.data.payout, expected.payout);
    assert.equal(result.data.balance, 10_000 + expected.payout);
    assert.equal("payoutOptions" in result.data, false);
    assert.equal(calls[0].payout, expected.payout);
  }
});

test("daily bonus resets the streak after a missed UTC day", async () => {
  const { store } = createStore({
    dailyBonusStreak: 7,
    lastDailyBonusClaimedOn: new Date("2026-07-25T00:00:00Z"),
  });
  const result = await createDailyBonusService(store, {
    now: () => new Date("2026-07-28T23:59:59Z"),
    rollRarity: () => 100,
  }).claim(7);

  assert.equal(result.data.dailyBonusStreak, 1);
  assert.equal(result.data.rarity, "GREEN");
  assert.equal(result.data.payout, 2_500);
  assert.equal(result.data.balance, 12_500);
  assert.deepEqual(
    result.data.lastDailyBonusClaimedOn,
    new Date("2026-07-28T00:00:00Z")
  );
});

test("daily bonus rejects a second claim on the same UTC day", async () => {
  const { calls, store } = createStore({
    dailyBonusStreak: 3,
    lastDailyBonusClaimedOn: new Date("2026-07-28T00:00:00Z"),
  });
  const service = createDailyBonusService(store, {
    now: () => new Date("2026-07-28T23:59:59Z"),
  });

  await assert.rejects(
    service.claim(7),
    (error) =>
      error.statusCode === 409 &&
      error.code === "DAILY_BONUS_ALREADY_CLAIMED"
  );
  assert.equal(calls.length, 0);
});

test("test reset clears the streak and makes the next claim available", async () => {
  const { store, state } = createStore({
    dailyBonusStreak: 4,
    lastDailyBonusClaimedOn: new Date("2026-07-28T00:00:00Z"),
  });
  const result = await createDailyBonusService(store).resetForTesting(7);

  assert.equal(result.data.dailyBonusStreak, 0);
  assert.equal(result.data.lastDailyBonusClaimedOn, null);
  assert.equal(state.dailyBonusStreak, 0);
  assert.equal(state.lastDailyBonusClaimedOn, null);
});

test("test reset is unavailable in production", async () => {
  const previousNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";

  try {
    await assert.rejects(
      createDailyBonusService(createStore().store).resetForTesting(7),
      (error) => error.statusCode === 404 && error.code === "NOT_FOUND"
    );
  } finally {
    if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousNodeEnv;
  }
});
