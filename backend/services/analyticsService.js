import AppError from "../utils/appError.js";
import {
  REPORTING_TIME_ZONE,
  reportingDateStartInstant,
  toReportingDate,
} from "../utils/reportingDate.js";
import { GAME_TYPES } from "../config/gameTypes.js";

const DAY_MS = 24 * 60 * 60 * 1_000;
const GAME_ORDER = ["roulette", "blackjack", "mines"];
const GAME_TYPE_BY_QUERY = Object.freeze({
  blackjack: GAME_TYPES.blackjack,
  mines: GAME_TYPES.mines,
  roulette: GAME_TYPES.roulette,
});
const QUERY_BY_GAME_TYPE = Object.freeze(
  Object.fromEntries(
    Object.entries(GAME_TYPE_BY_QUERY).map(([query, gameType]) => [
      gameType,
      query,
    ])
  )
);
const RANGE_OPTIONS = new Set(["day", "week", "month", "year", "all"]);
const GAME_OPTIONS = new Set(["all", ...GAME_ORDER]);

const formatDate = (date) => date.toISOString().slice(0, 10);
const addDays = (date, days) =>
  new Date(date.getTime() + days * DAY_MS);
const dayDifference = (left, right) =>
  Math.round((right.getTime() - left.getTime()) / DAY_MS);
const money = (value) => Number(Number(value).toFixed(2));

function emptyTotals() {
  return {
    gamesPlayed: 0,
    totalWagered: 0,
    totalPayout: 0,
    maxGameNet: null,
  };
}

function addStat(total, stat) {
  total.gamesPlayed += stat.gamesPlayed;
  total.totalWagered += stat.totalWagered;
  total.totalPayout += stat.totalPayout;
  if (
    stat.maxGameNet != null &&
    (total.maxGameNet == null || stat.maxGameNet > total.maxGameNet)
  ) {
    total.maxGameNet = stat.maxGameNet;
  }
}

function serializeTotals(total) {
  const totalWagered = money(total.totalWagered);
  const totalPayout = money(total.totalPayout);
  return {
    gamesPlayed: total.gamesPlayed,
    totalWagered,
    totalPayout,
    netResult: money(totalPayout - totalWagered),
    maxGameNet:
      total.maxGameNet == null ? null : money(total.maxGameNet),
  };
}

function fixedRange(range, today) {
  if (range === "day") {
    return { start: today, end: today, bucket: null };
  }
  if (range === "week") {
    return { start: addDays(today, -6), end: today, bucket: "day" };
  }
  if (range === "month") {
    return { start: addDays(today, -29), end: today, bucket: "day" };
  }
  return { start: addDays(today, -364), end: today, bucket: "week" };
}

function allTimeBucket(start, end) {
  const days = dayDifference(start, end) + 1;
  if (days <= 90) return "day";
  if (days <= 730) return "week";
  return "month";
}

function monthEnd(date) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)
  );
}

function createBuckets(start, end, bucket) {
  const buckets = [];
  if (bucket === "day") {
    for (let current = start; current <= end; current = addDays(current, 1)) {
      buckets.push({
        start: formatDate(current),
        end: formatDate(current),
        totals: emptyTotals(),
      });
    }
    return buckets;
  }

  if (bucket === "week") {
    for (let current = start; current <= end; current = addDays(current, 7)) {
      const bucketEnd = addDays(current, 6);
      buckets.push({
        start: formatDate(current),
        end: formatDate(bucketEnd > end ? end : bucketEnd),
        totals: emptyTotals(),
      });
    }
    return buckets;
  }

  for (
    let current = start;
    current <= end;
    current = new Date(
      Date.UTC(current.getUTCFullYear(), current.getUTCMonth() + 1, 1)
    )
  ) {
    const bucketEnd = monthEnd(current);
    buckets.push({
      start: formatDate(current),
      end: formatDate(bucketEnd > end ? end : bucketEnd),
      totals: emptyTotals(),
    });
  }
  return buckets;
}

function bucketIndexForDate(periodStart, start, bucket) {
  const daysFromStart = dayDifference(start, periodStart);
  if (bucket === "day") return daysFromStart;
  if (bucket === "week") return Math.floor(daysFromStart / 7);
  return (
    (periodStart.getUTCFullYear() - start.getUTCFullYear()) * 12 +
    periodStart.getUTCMonth() -
    start.getUTCMonth()
  );
}

function buildTimeline(rows, start, end, bucket) {
  if (!bucket || rows.length === 0) return [];
  const buckets = createBuckets(start, end, bucket);
  for (const row of rows) {
    const index = bucketIndexForDate(row.periodStart, start, bucket);
    if (buckets[index]) addStat(buckets[index].totals, row);
  }
  return buckets.map(({ start: bucketStart, end: bucketEnd, totals }) => ({
    start: bucketStart,
    end: bucketEnd,
    ...serializeTotals(totals),
  }));
}

function validateOptions(range, game) {
  if (!RANGE_OPTIONS.has(range) || !GAME_OPTIONS.has(game)) {
    throw new AppError(
      "Invalid analytics range or game",
      400,
      "INVALID_INPUT"
    );
  }
}

function decodeCursor(cursor) {
  if (!cursor) return null;
  try {
    const value = JSON.parse(
      Buffer.from(cursor, "base64url").toString("utf8")
    );
    const completedAt = new Date(value.completedAt);
    if (
      typeof value.id !== "string" ||
      typeof value.completedAt !== "string" ||
      !/^\d+$/.test(value.id) ||
      Number.isNaN(completedAt.getTime())
    ) {
      throw new Error("Invalid cursor");
    }
    return { completedAt, id: BigInt(value.id) };
  } catch {
    throw new AppError(
      "Invalid analytics history cursor",
      400,
      "INVALID_INPUT"
    );
  }
}

function encodeCursor(result) {
  return Buffer.from(
    JSON.stringify({
      completedAt: result.completedAt.toISOString(),
      id: result.id,
    })
  ).toString("base64url");
}

export function createAnalyticsService(store, { now = () => new Date() } = {}) {
  return {
    async getAnalytics({ userId, range = "all", game = "all" }) {
      validateOptions(range, game);
      const today = new Date(`${toReportingDate(now())}T00:00:00.000Z`);
      const selectedGameType =
        game === "all" ? undefined : GAME_TYPE_BY_QUERY[game];
      let period;

      if (range === "all") {
        const oldest = await store.analytics.findOldestGameResultAt(
          userId,
          selectedGameType
        );
        const oldestDate = oldest
          ? new Date(`${toReportingDate(oldest)}T00:00:00.000Z`)
          : null;
        period = oldest
          ? {
              start: oldestDate,
              end: today,
              bucket: allTimeBucket(oldestDate, today),
            }
          : { start: today, end: today, bucket: null };
      } else {
        period = fixedRange(range, today);
      }

      const startDate = formatDate(period.start);
      const endDate = formatDate(period.end);
      const startAt = reportingDateStartInstant(startDate);
      const endAt = reportingDateStartInstant(
        formatDate(addDays(period.end, 1))
      );
      const summaryRows = await store.analytics.summarizeGameResults({
        userId,
        startAt,
        endAt,
      });

      const totalsByGame = Object.fromEntries(
        GAME_ORDER.map((gameName) => [gameName, emptyTotals()])
      );
      for (const row of summaryRows) {
        const gameName = QUERY_BY_GAME_TYPE[row.gameType];
        if (gameName) addStat(totalsByGame[gameName], row);
      }

      const summary = emptyTotals();
      if (game === "all") {
        for (const total of Object.values(totalsByGame)) {
          addStat(summary, total);
        }
      } else {
        addStat(summary, totalsByGame[game]);
      }

      const timelineRows = period.bucket
        ? await store.analytics.summarizeGameResultTimeline({
            userId,
            gameType: selectedGameType,
            startAt,
            endAt,
            startDate,
            bucket: period.bucket,
          })
        : [];

      return {
        range,
        game,
        timezone: REPORTING_TIME_ZONE,
        period: {
          start: startDate,
          end: endDate,
          bucket: period.bucket,
        },
        summary: serializeTotals(summary),
        games: GAME_ORDER.map((gameName) => ({
          game: gameName,
          ...serializeTotals(totalsByGame[gameName]),
        })),
        timeline: buildTimeline(
          timelineRows,
          period.start,
          period.end,
          period.bucket
        ),
      };
    },

    async getHistory({
      userId,
      game = "all",
      limit = "25",
      cursor,
    }) {
      if (!GAME_OPTIONS.has(game)) {
        throw new AppError(
          "Invalid analytics game",
          400,
          "INVALID_INPUT"
        );
      }
      const parsedLimit = Number(limit);
      if (
        !Number.isInteger(parsedLimit) ||
        parsedLimit < 1 ||
        parsedLimit > 100
      ) {
        throw new AppError(
          "Analytics history limit must be between 1 and 100",
          400,
          "INVALID_INPUT"
        );
      }

      const decodedCursor = decodeCursor(cursor);
      const rows = await store.analytics.listGameResults({
        userId,
        gameType:
          game === "all" ? undefined : GAME_TYPE_BY_QUERY[game],
        cursorCompletedAt: decodedCursor?.completedAt,
        cursorId: decodedCursor?.id,
        limit: parsedLimit,
      });
      const hasMore = rows.length > parsedLimit;
      const visibleRows = rows.slice(0, parsedLimit);
      const results = visibleRows.map((row) => ({
        id: row.id,
        game: QUERY_BY_GAME_TYPE[row.gameType],
        wagered: money(row.wagered),
        payout: money(row.payout),
        netResult: money(row.payout - row.wagered),
        completedAt: row.completedAt.toISOString(),
      }));

      return {
        game,
        limit: parsedLimit,
        results,
        nextCursor:
          hasMore && visibleRows.length
            ? encodeCursor(visibleRows[visibleRows.length - 1])
            : null,
      };
    },
  };
}
