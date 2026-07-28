import assert from "node:assert/strict";
import test from "node:test";
import { createAnalyticsService } from "../analyticsService.js";
import { GAME_TYPES } from "../../config/gameTypes.js";
import {
  reportingDateStartInstant,
  toReportingDate,
} from "../../utils/reportingDate.js";

const atDate = (date) => new Date(`${date}T00:00:00.000Z`);

function summaryStat(
  gameType,
  gamesPlayed,
  totalWagered,
  totalPayout,
  maxGameNet
) {
  return {
    gameType,
    gamesPlayed,
    totalWagered,
    totalPayout,
    maxGameNet,
  };
}

function timelineStat(
  periodStart,
  gamesPlayed,
  totalWagered,
  totalPayout,
  maxGameNet
) {
  return {
    periodStart: atDate(periodStart),
    gamesPlayed,
    totalWagered,
    totalPayout,
    maxGameNet,
  };
}

function createStore({
  summaryRows = [],
  timelineRows = [],
  historyRows = [],
  oldest = null,
} = {}) {
  const calls = [];
  return {
    calls,
    analytics: {
      async findOldestGameResultAt(userId, gameType) {
        calls.push({
          method: "findOldestGameResultAt",
          userId,
          gameType,
        });
        return oldest;
      },
      async summarizeGameResults(input) {
        calls.push({ method: "summarizeGameResults", ...input });
        return summaryRows;
      },
      async summarizeGameResultTimeline(input) {
        calls.push({
          method: "summarizeGameResultTimeline",
          ...input,
        });
        return timelineRows;
      },
      async listGameResults(input) {
        calls.push({ method: "listGameResults", ...input });
        return historyRows;
      },
    },
  };
}

test("month analytics returns game breakdown and a zero-filled combined timeline", async () => {
  const summaryRows = [
    summaryStat(GAME_TYPES.roulette, 1, 10, 0, -10),
    summaryStat(GAME_TYPES.blackjack, 1, 10, 15, 5),
    summaryStat(GAME_TYPES.mines, 1, 20, 20, 0),
  ];
  const timelineRows = [
    timelineStat("2026-07-01", 2, 20, 15, 5),
    timelineStat("2026-07-28", 1, 20, 20, 0),
  ];
  const store = createStore({ summaryRows, timelineRows });
  const service = createAnalyticsService(store, {
    now: () => new Date("2026-07-28T18:00:00.000Z"),
  });

  const result = await service.getAnalytics({
    userId: 7,
    range: "month",
    game: "all",
  });

  assert.deepEqual(result.period, {
    start: "2026-06-29",
    end: "2026-07-28",
    bucket: "day",
  });
  assert.deepEqual(result.summary, {
    gamesPlayed: 3,
    totalWagered: 40,
    totalPayout: 35,
    netResult: -5,
    maxGameNet: 5,
  });
  assert.equal(result.timeline.length, 30);
  assert.deepEqual(result.timeline[2], {
    start: "2026-07-01",
    end: "2026-07-01",
    gamesPlayed: 2,
    totalWagered: 20,
    totalPayout: 15,
    netResult: -5,
    maxGameNet: 5,
  });
  assert.deepEqual(
    result.games.map(({ game, netResult }) => ({ game, netResult })),
    [
      { game: "roulette", netResult: -10 },
      { game: "blackjack", netResult: 5 },
      { game: "mines", netResult: 0 },
    ]
  );
});

test("specific-game analytics filters summary and timeline but keeps every game breakdown", async () => {
  const summaryRows = [
    summaryStat(GAME_TYPES.roulette, 2, 20, 0, -10),
    summaryStat(GAME_TYPES.blackjack, 1, 10, 15, 5),
  ];
  const timelineRows = [
    timelineStat("2026-07-28", 1, 10, 15, 5),
  ];
  const service = createAnalyticsService(
    createStore({ summaryRows, timelineRows }),
    {
      now: () => new Date("2026-07-28T18:00:00.000Z"),
    }
  );

  const result = await service.getAnalytics({
    userId: 7,
    range: "week",
    game: "blackjack",
  });

  assert.equal(result.summary.gamesPlayed, 1);
  assert.equal(result.summary.netResult, 5);
  assert.equal(result.timeline.length, 7);
  assert.equal(result.timeline[6].netResult, 5);
  assert.deepEqual(
    result.games.map(({ game, gamesPlayed }) => ({ game, gamesPlayed })),
    [
      { game: "roulette", gamesPlayed: 2 },
      { game: "blackjack", gamesPlayed: 1 },
      { game: "mines", gamesPlayed: 0 },
    ]
  );
});

test("empty all-time analytics returns zero summaries and no timeline", async () => {
  const service = createAnalyticsService(createStore(), {
    now: () => new Date("2026-07-28T18:00:00.000Z"),
  });

  const result = await service.getAnalytics({
    userId: 7,
    range: "all",
    game: "all",
  });

  assert.deepEqual(result.period, {
    start: "2026-07-28",
    end: "2026-07-28",
    bucket: null,
  });
  assert.deepEqual(result.summary, {
    gamesPlayed: 0,
    totalWagered: 0,
    totalPayout: 0,
    netResult: 0,
    maxGameNet: null,
  });
  assert.equal(result.timeline.length, 0);
});

test("all-time analytics chooses daily, weekly, and monthly buckets by age", async () => {
  const cases = [
    ["2026-04-30", "day"],
    ["2026-04-29", "week"],
    ["2024-07-30", "week"],
    ["2024-07-28", "month"],
  ];

  for (const [oldestDate, expectedBucket] of cases) {
    const oldest = new Date(`${oldestDate}T18:00:00.000Z`);
    const row = summaryStat(GAME_TYPES.blackjack, 1, 10, 10, 0);
    const service = createAnalyticsService(
      createStore({
        summaryRows: [row],
        timelineRows: [timelineStat(oldestDate, 1, 10, 10, 0)],
        oldest,
      }),
      {
        now: () => new Date("2026-07-28T18:00:00.000Z"),
      }
    );
    const result = await service.getAnalytics({
      userId: 7,
      range: "all",
      game: "blackjack",
    });
    assert.equal(result.period.bucket, expectedBucket, oldestDate);
  }
});

test("analytics rejects unsupported range and game values", async () => {
  const service = createAnalyticsService(createStore());

  await assert.rejects(
    service.getAnalytics({ userId: 7, range: "quarter", game: "all" }),
    (error) => error.statusCode === 400 && error.code === "INVALID_INPUT"
  );
  await assert.rejects(
    service.getAnalytics({ userId: 7, range: "all", game: "slots" }),
    (error) => error.statusCode === 400 && error.code === "INVALID_INPUT"
  );
});

test("game history returns individual results with an opaque cursor", async () => {
  const historyRows = [
    {
      id: "3",
      gameType: GAME_TYPES.roulette,
      wagered: 10,
      payout: 0,
      completedAt: new Date("2026-07-28T18:03:00.000Z"),
    },
    {
      id: "2",
      gameType: GAME_TYPES.blackjack,
      wagered: 10,
      payout: 15,
      completedAt: new Date("2026-07-28T18:02:00.000Z"),
    },
    {
      id: "1",
      gameType: GAME_TYPES.mines,
      wagered: 20,
      payout: 50,
      completedAt: new Date("2026-07-28T18:01:00.000Z"),
    },
  ];
  const store = createStore({ historyRows });
  const service = createAnalyticsService(store);

  const result = await service.getHistory({
    userId: 7,
    game: "all",
    limit: "2",
  });

  assert.deepEqual(result.results, [
    {
      id: "3",
      game: "roulette",
      wagered: 10,
      payout: 0,
      netResult: -10,
      completedAt: "2026-07-28T18:03:00.000Z",
    },
    {
      id: "2",
      game: "blackjack",
      wagered: 10,
      payout: 15,
      netResult: 5,
      completedAt: "2026-07-28T18:02:00.000Z",
    },
  ]);
  assert.ok(result.nextCursor);

  await service.getHistory({
    userId: 7,
    game: "blackjack",
    limit: "2",
    cursor: result.nextCursor,
  });
  const nextCall = store.calls.at(-1);
  assert.equal(nextCall.gameType, GAME_TYPES.blackjack);
  assert.equal(nextCall.cursorId, 2n);
  assert.equal(
    nextCall.cursorCompletedAt.toISOString(),
    "2026-07-28T18:02:00.000Z"
  );
});

test("game history validates game, limit, and cursor", async () => {
  const service = createAnalyticsService(createStore());
  for (const input of [
    { game: "slots" },
    { limit: "0" },
    { limit: "101" },
    { cursor: "not-a-cursor" },
  ]) {
    await assert.rejects(
      service.getHistory({ userId: 7, ...input }),
      (error) => error.statusCode === 400 && error.code === "INVALID_INPUT"
    );
  }
});

test("Central reporting dates remain correct across the DST transition", () => {
  assert.equal(
    toReportingDate(new Date("2026-03-08T05:59:00.000Z")),
    "2026-03-07"
  );
  assert.equal(
    toReportingDate(new Date("2026-03-08T06:01:00.000Z")),
    "2026-03-08"
  );
  assert.equal(
    reportingDateStartInstant("2026-03-08").toISOString(),
    "2026-03-08T06:00:00.000Z"
  );
  assert.equal(
    reportingDateStartInstant("2026-11-01").toISOString(),
    "2026-11-01T05:00:00.000Z"
  );
});
