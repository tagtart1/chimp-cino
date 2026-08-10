import "../utils/loadEnv.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "../generated/prisma/client.ts";
import { assertDataStore, DataStoreError } from "./dataStore.js";

const TRANSACTION_OPTIONS = {
  isolationLevel: "Serializable",
  maxWait: 5_000,
  timeout: 10_000,
};
const MAX_TRANSACTION_ATTEMPTS = 3;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required");
}

const hostname = new URL(connectionString).hostname;
const adapter = new PrismaPg({
  connectionString,
  ssl: hostname.endsWith(".render.com")
    ? { rejectUnauthorized: true }
    : undefined,
});
const prisma = new PrismaClient({ adapter });

const number = (value) => (value == null ? value : Number(value));

const mapUser = (user) =>
  user && {
    id: user.id,
    username: user.username,
    email: user.email,
    password: user.password,
    balance: number(user.balance),
    dailyBonusStreak: user.dailyBonusStreak,
    lastDailyBonusClaimedOn: user.lastDailyBonusClaimedOn,
  };

const mapCard = (handCard) => ({
  id: handCard.card.id,
  suit: handCard.card.suit,
  rank: handCard.card.rank,
  value: handCard.card.value,
  sequence: handCard.sequence,
});

const mapCanonicalCard = (card) => ({
  id: card.id,
  suit: card.suit,
  rank: card.rank,
  value: card.value,
});

const mapPermission = (permission) => ({
  id: permission.id,
  key: permission.key,
  displayName: permission.displayName,
});

const mapRole = (role) => ({
  id: role.id,
  key: role.key,
  displayName: role.displayName,
  ...(role.permissions
    ? { permissions: role.permissions.map(mapPermission) }
    : {}),
});

const mapAdminUser = (user) =>
  user && {
    id: user.id,
    username: user.username,
    email: user.email,
    balance: number(user.balance),
    dailyBonusStreak: user.dailyBonusStreak,
    lastDailyBonusClaimedOn: user.lastDailyBonusClaimedOn,
    ...(user.roles
      ? { roles: user.roles.map(mapRole) }
      : {}),
  };

const handInclude = {
  cards: {
    orderBy: { sequence: "asc" },
    include: { card: true },
  },
};

const mapHand = (hand) => ({
  id: hand.id,
  isPlayer: hand.isPlayer,
  isSelected: hand.isSelected,
  isCompleted: hand.isCompleted,
  isBust: hand.isBust,
  bet: number(hand.bet),
  cards: hand.cards.map(mapCard),
});

const mapBlackjackGame = (game) =>
  game && {
    id: game.id,
    userId: game.userId,
    startBet: number(game.startBet),
    totalWagered: number(game.totalWagered),
    isGameOver: game.isGameOver,
    offerInsurance: game.offerInsurance,
    hands: game.hands.map(mapHand),
  };

const mapMinesGame = (game) =>
  game && {
    id: game.id,
    userId: game.userId,
    bet: number(game.bet),
    multiplier: number(game.multiplier),
    cells: game.cells.map((cell) => ({
      field: cell.field,
      isGem: cell.isGem,
      isRevealed: cell.isRevealed,
    })),
  };

function translatePersistenceError(error) {
  if (error instanceof DataStoreError) return error;
  if (error?.code === "P2002") {
    return new DataStoreError("A unique value already exists", "CONFLICT");
  }
  if (error?.code === "P2025") {
    return new DataStoreError(
      "The requested record does not exist",
      "NOT_FOUND"
    );
  }
  return new DataStoreError("The persistence operation failed");
}

function protectRepositories(store) {
  for (const repositoryName of [
    "users",
    "wallet",
    "blackjack",
    "mines",
    "analytics",
    "admin",
  ]) {
    const repository = store[repositoryName];
    for (const methodName of Object.keys(repository)) {
      const method = repository[methodName];
      repository[methodName] = async function protectedRepositoryMethod(
        ...args
      ) {
        try {
          return await method.apply(repository, args);
        } catch (error) {
          if (error?.code === "P2034") throw error;
          throw translatePersistenceError(error);
        }
      };
    }
  }
  return store;
}

function repositories(client, inTransaction = false) {
  const store = {
    transaction: inTransaction
      ? async (work) => work(store)
      : (work) => runTransaction(work),

    users: {
      async findByLogin(identifier) {
        const user = await client.user.findFirst({
          where: {
            OR: [{ username: identifier }, { email: identifier }],
          },
        });
        return mapUser(user);
      },

      async exists({ username, email }) {
        return (
          (await client.user.count({
            where: {
              OR: [
                { username: { equals: username, mode: "insensitive" } },
                { email: email.toLowerCase() },
              ],
            },
          })) > 0
        );
      },

      async create({ username, email, password, balance }) {
        return mapUser(
          await client.user.create({
            data: {
              username,
              email: email.toLowerCase(),
              password,
              balance,
            },
          })
        );
      },

      async findStateById(userId) {
        const user = await client.user.findUnique({
          where: { id: userId },
          select: {
            balance: true,
            dailyBonusStreak: true,
            lastDailyBonusClaimedOn: true,
          },
        });
        return user && { ...user, balance: number(user.balance) };
      },

      async claimDailyBonus({ userId, streak, payout, claimedOn }) {
        const user = await client.user.update({
          where: { id: userId },
          data: {
            dailyBonusStreak: streak,
            lastDailyBonusClaimedOn: claimedOn,
            balance: { increment: payout },
          },
          select: { balance: true },
        });
        return { balance: number(user.balance) };
      },

      async resetDailyBonusForTesting(userId) {
        return client.user.update({
          where: { id: userId },
          data: {
            dailyBonusStreak: 0,
            lastDailyBonusClaimedOn: null,
          },
          select: {
            dailyBonusStreak: true,
            lastDailyBonusClaimedOn: true,
          },
        });
      },
    },

    wallet: {
      async getBalance(userId) {
        const user = await client.user.findUnique({
          where: { id: userId },
          select: { balance: true },
        });
        return user ? number(user.balance) : null;
      },

      async withdrawIfSufficient(userId, amount) {
        const [user] = await client.user.updateManyAndReturn({
          where: { id: userId, balance: { gte: amount } },
          data: { balance: { decrement: amount } },
          select: { balance: true },
        });
        return user ? number(user.balance) : null;
      },

      async credit(userId, amount) {
        const user = await client.user.update({
          where: { id: userId },
          data: { balance: { increment: amount } },
          select: { balance: true },
        });
        return number(user.balance);
      },
    },

    blackjack: {
      async findGameByUserId(userId) {
        const game = await client.activeBlackjackGame.findUnique({
          where: { userId },
          include: {
            hands: {
              orderBy: { id: "asc" },
              include: handInclude,
            },
          },
        });
        return mapBlackjackGame(game);
      },

      async findGameStatusByUserId(userId) {
        return client.activeBlackjackGame.findUnique({
          where: { userId },
          select: { id: true, isGameOver: true },
        });
      },

      async createGame({ userId, bet }) {
        const game = await client.activeBlackjackGame.create({
          data: {
            userId,
            startBet: bet,
            totalWagered: bet,
            hands: {
              create: [
                { isPlayer: true, isSelected: true, bet },
                { isPlayer: false, isSelected: true, bet: 0 },
              ],
            },
          },
          include: {
            hands: {
              orderBy: { id: "asc" },
              include: handInclude,
            },
          },
        });
        return mapBlackjackGame(game);
      },

      async deleteGame(gameId) {
        await client.activeBlackjackGame.delete({ where: { id: gameId } });
      },

      async listCanonicalCards() {
        const cards = await client.card.findMany({
          orderBy: { id: "asc" },
        });
        return cards.map(mapCanonicalCard);
      },

      async addCardsToHands(cards) {
        const result = await client.activeHandCard.createMany({
          data: cards,
        });
        return result.count;
      },

      async removeCardFromHand(handId, sequence) {
        const removed = await client.activeHandCard.delete({
          where: { handId_sequence: { handId, sequence } },
        });
        return { cardId: removed.cardId, sequence: removed.sequence };
      },

      async createHand({ gameId, isPlayer, isSelected, bet, card }) {
        const hand = await client.activeHand.create({
          data: {
            gameId,
            isPlayer,
            isSelected,
            bet,
            cards: card
              ? {
                  create: {
                    cardId: card.cardId,
                    sequence: card.sequence,
                  },
                }
              : undefined,
          },
          include: handInclude,
        });
        return mapHand(hand);
      },

      countPlayerHands(gameId) {
        return client.activeHand.count({
          where: { gameId, isPlayer: true },
        });
      },

      async updateHand(handId, changes) {
        const data = {};
        if (changes.isSelected !== undefined)
          data.isSelected = changes.isSelected;
        if (changes.isCompleted !== undefined)
          data.isCompleted = changes.isCompleted;
        if (changes.isBust !== undefined) data.isBust = changes.isBust;
        await client.activeHand.update({ where: { id: handId }, data });
      },

      async doubleHandBet(handId) {
        await client.activeHand.update({
          where: { id: handId },
          data: { bet: { multiply: 2 } },
        });
      },

      async incrementTotalWagered(gameId, amount) {
        await client.activeBlackjackGame.update({
          where: { id: gameId },
          data: { totalWagered: { increment: amount } },
        });
      },

      async setGameOver(gameId, isGameOver = true) {
        await client.activeBlackjackGame.update({
          where: { id: gameId },
          data: { isGameOver },
        });
      },

      async setOfferInsurance(gameId, offerInsurance) {
        await client.activeBlackjackGame.update({
          where: { id: gameId },
          data: { offerInsurance },
        });
      },

    },

    mines: {
      async findGameByUserId(userId) {
        const game = await client.activeMinesGame.findUnique({
          where: { userId },
          include: { cells: { orderBy: { field: "asc" } } },
        });
        return mapMinesGame(game);
      },

      async createGame({ userId, bet, cells }) {
        const game = await client.activeMinesGame.create({
          data: {
            userId,
            bet,
            multiplier: 1,
            cells: { createMany: { data: cells } },
          },
          include: { cells: { orderBy: { field: "asc" } } },
        });
        return mapMinesGame(game);
      },

      async revealCells(gameId, fields) {
        await client.activeCell.updateMany({
          where: { gameId, field: { in: fields } },
          data: { isRevealed: true },
        });
      },

      async updateMultiplier(gameId, multiplier) {
        await client.activeMinesGame.update({
          where: { id: gameId },
          data: { multiplier },
        });
      },

      async deleteGame(gameId) {
        await client.activeMinesGame.delete({ where: { id: gameId } });
      },
    },

    analytics: {
      async recordGameResult({ userId, gameType, wagered, payout }) {
        await client.gameResult.create({
          data: { userId, gameType, wagered, payout },
        });
      },

      async findOldestGameResultAt(userId, gameType) {
        const row = await client.gameResult.findFirst({
          where: {
            userId,
            ...(gameType ? { gameType } : {}),
          },
          orderBy: { completedAt: "asc" },
          select: { completedAt: true },
        });
        return row?.completedAt ?? null;
      },

      async summarizeGameResults({ userId, startAt, endAt }) {
        const rows = await client.$queryRaw`
          SELECT
            "game_type",
            COUNT(*)::INTEGER AS "games_played",
            SUM("wagered") AS "total_wagered",
            SUM("payout") AS "total_payout",
            MAX("payout" - "wagered") AS "max_game_net"
          FROM "game_results"
          WHERE "user_id" = ${userId}
            AND "completed_at" >= ${startAt}
            AND "completed_at" < ${endAt}
          GROUP BY "game_type"
          ORDER BY "game_type"
        `;
        return rows.map((row) => ({
          gameType: row.game_type,
          gamesPlayed: row.games_played,
          totalWagered: number(row.total_wagered),
          totalPayout: number(row.total_payout),
          maxGameNet: number(row.max_game_net),
        }));
      },

      async summarizeGameResultTimeline({
        userId,
        gameType,
        startAt,
        endAt,
        startDate,
        bucket,
      }) {
        const gameFilter = gameType
          ? Prisma.sql`AND "game_type"::TEXT = ${gameType}`
          : Prisma.empty;
        const rows = await client.$queryRaw`
          WITH "filtered_results" AS (
            SELECT
              ("completed_at" AT TIME ZONE 'America/Chicago')::DATE
                AS "local_date",
              "wagered",
              "payout"
            FROM "game_results"
            WHERE "user_id" = ${userId}
              AND "completed_at" >= ${startAt}
              AND "completed_at" < ${endAt}
              ${gameFilter}
          )
          SELECT
            CASE
              WHEN ${bucket} = 'day' THEN "local_date"
              WHEN ${bucket} = 'week' THEN
                CAST(${startDate} AS DATE)
                + (
                    ("local_date" - CAST(${startDate} AS DATE)) / 7
                  ) * 7
              ELSE DATE_TRUNC('month', "local_date")::DATE
            END AS "period_start",
            COUNT(*)::INTEGER AS "games_played",
            SUM("wagered") AS "total_wagered",
            SUM("payout") AS "total_payout",
            MAX("payout" - "wagered") AS "max_game_net"
          FROM "filtered_results"
          GROUP BY "period_start"
          ORDER BY "period_start"
        `;
        return rows.map((row) => ({
          periodStart: row.period_start,
          gamesPlayed: row.games_played,
          totalWagered: number(row.total_wagered),
          totalPayout: number(row.total_payout),
          maxGameNet: number(row.max_game_net),
        }));
      },

      async listGameResults({
        userId,
        gameType,
        cursorCompletedAt,
        cursorId,
        limit,
      }) {
        const rows = await client.gameResult.findMany({
          where: {
            userId,
            ...(gameType ? { gameType } : {}),
            ...(cursorCompletedAt
              ? {
                  OR: [
                    { completedAt: { lt: cursorCompletedAt } },
                    {
                      completedAt: cursorCompletedAt,
                      id: { lt: cursorId },
                    },
                  ],
                }
              : {}),
          },
          orderBy: [{ completedAt: "desc" }, { id: "desc" }],
          take: limit + 1,
        });
        return rows.map((row) => ({
          id: row.id.toString(),
          gameType: row.gameType,
          wagered: number(row.wagered),
          payout: number(row.payout),
          completedAt: row.completedAt,
        }));
      },
    },

    admin: {
      async searchUsers({ query, limit }) {
        const users = await client.user.findMany({
          where: query
            ? {
                OR: [
                  { username: { contains: query, mode: "insensitive" } },
                  { email: { contains: query, mode: "insensitive" } },
                ],
              }
            : undefined,
          orderBy: { id: "desc" },
          take: limit,
          select: {
            id: true,
            username: true,
            email: true,
            balance: true,
            dailyBonusStreak: true,
            lastDailyBonusClaimedOn: true,
          },
        });
        return users.map(mapAdminUser);
      },

      async findUserById(userId) {
        const user = await client.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            username: true,
            email: true,
            balance: true,
            dailyBonusStreak: true,
            lastDailyBonusClaimedOn: true,
            roles: { orderBy: { displayName: "asc" } },
          },
        });
        return mapAdminUser(user);
      },

      async listRoles() {
        const roles = await client.role.findMany({
          orderBy: [{ displayName: "asc" }, { id: "asc" }],
          include: {
            permissions: { orderBy: { displayName: "asc" } },
          },
        });
        return roles.map(mapRole);
      },

      async createRole(input) {
        return mapRole(
          await client.role.create({
            data: input,
            include: { permissions: true },
          })
        );
      },

      async updateRole(roleId, input) {
        return mapRole(
          await client.role.update({
            where: { id: roleId },
            data: input,
            include: {
              permissions: { orderBy: { displayName: "asc" } },
            },
          })
        );
      },

      async deleteRole(roleId) {
        await client.role.delete({ where: { id: roleId } });
      },

      async setUserRoles(userId, roleIds) {
        const user = await client.user.update({
          where: { id: userId },
          data: {
            roles: {
              set: roleIds.map((id) => ({ id })),
            },
          },
          select: {
            id: true,
            username: true,
            email: true,
            balance: true,
            dailyBonusStreak: true,
            lastDailyBonusClaimedOn: true,
            roles: { orderBy: { displayName: "asc" } },
          },
        });
        return mapAdminUser(user);
      },

      async listPermissions() {
        const permissions = await client.permission.findMany({
          orderBy: [{ displayName: "asc" }, { id: "asc" }],
        });
        return permissions.map(mapPermission);
      },

      async createPermission(input) {
        return mapPermission(await client.permission.create({ data: input }));
      },

      async updatePermission(permissionId, input) {
        return mapPermission(
          await client.permission.update({
            where: { id: permissionId },
            data: input,
          })
        );
      },

      async deletePermission(permissionId) {
        await client.permission.delete({ where: { id: permissionId } });
      },

      async setRolePermissions(roleId, permissionIds) {
        const role = await client.role.update({
          where: { id: roleId },
          data: {
            permissions: {
              set: permissionIds.map((id) => ({ id })),
            },
          },
          include: {
            permissions: { orderBy: { displayName: "asc" } },
          },
        });
        return mapRole(role);
      },

      async resetDailyBonus(userId) {
        const user = await client.user.update({
          where: { id: userId },
          data: {
            dailyBonusStreak: 0,
            lastDailyBonusClaimedOn: null,
          },
          select: {
            id: true,
            username: true,
            email: true,
            balance: true,
            dailyBonusStreak: true,
            lastDailyBonusClaimedOn: true,
            roles: { orderBy: { displayName: "asc" } },
          },
        });
        return mapAdminUser(user);
      },
    },
  };

  return assertDataStore(protectRepositories(store));
}

async function runTransaction(work) {
  for (let attempt = 1; attempt <= MAX_TRANSACTION_ATTEMPTS; attempt++) {
    try {
      return await prisma.$transaction(
        (transactionClient) =>
          work(repositories(transactionClient, true)),
        TRANSACTION_OPTIONS
      );
    } catch (error) {
      if (error?.code === "P2034" && attempt < MAX_TRANSACTION_ATTEMPTS) {
        continue;
      }
      if (error?.code?.startsWith?.("P")) {
        throw translatePersistenceError(error);
      }
      throw error;
    }
  }
}

export const dataStore = repositories(prisma);

export async function disconnectDataStore() {
  await prisma.$disconnect();
}
