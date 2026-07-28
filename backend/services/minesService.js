import AppError from "../utils/appError.js";
import { GAME_TYPES } from "../config/gameTypes.js";

const GAME_SIZE = 25;

const calculateMultiplier = (starterMulti, mines, unrevealed, newReveals) => {
  let currentMulti = starterMulti;
  for (let index = 0; index < newReveals; index++) {
    const tax = unrevealed === GAME_SIZE && index === 0 ? 0.99 : 1;
    currentMulti = currentMulti * (1 / (1 - mines / unrevealed)) * tax;
    unrevealed--;
  }
  return Number(currentMulti.toFixed(6));
};

const finalGrid = (cells) => cells.map((cell) => (cell.isGem ? 1 : 2));

function requireGame(game) {
  if (!game) {
    throw new AppError("Game not found.", 404, "NOT_FOUND");
  }
  return game;
}

export function createMinesService(store) {
  const cashoutGame = async (transaction, game, userId) => {
    if (game.multiplier <= 1) {
      throw new AppError(
        "You must first play before cashing out!",
        400,
        "INVALID_INPUT"
      );
    }

    const winnings = game.bet * game.multiplier;
    await transaction.wallet.credit(userId, winnings);
    await transaction.analytics.recordGameResult({
      userId,
      gameType: GAME_TYPES.mines,
      wagered: game.bet,
      payout: winnings,
    });
    await transaction.mines.deleteGame(game.id);

    return {
      data: {
        isGameOver: true,
        cells: finalGrid(game.cells),
        multiplier: game.multiplier,
        payout: winnings,
      },
    };
  };

  return {
    async start({ userId, bet, mines }) {
      return store.transaction(async (transaction) => {
        if (await transaction.mines.findGameByUserId(userId)) {
          throw new AppError(
            "Game already in progress!",
            401,
            "INVALID_ACTION"
          );
        }

        const balance = await transaction.wallet.withdrawIfSufficient(
          userId,
          bet
        );
        if (balance == null) {
          throw new AppError(
            "You are too broke to place this bet.",
            400,
            "INVALID_BET"
          );
        }

        const mineFields = new Set();
        while (mineFields.size < mines) {
          mineFields.add(Math.floor(Math.random() * GAME_SIZE));
        }

        await transaction.mines.createGame({
          userId,
          bet,
          cells: Array.from({ length: GAME_SIZE }, (_, field) => ({
            field,
            isGem: !mineFields.has(field),
            isRevealed: false,
          })),
        });
      });
    },

    async resume(userId) {
      const game = requireGame(await store.mines.findGameByUserId(userId));
      let mineCount = 0;
      let gemCount = 0;
      const cells = game.cells.map((cell) => {
        if (!cell.isGem) mineCount++;
        if (!cell.isRevealed && cell.isGem) gemCount++;
        return cell.isRevealed ? 1 : 0;
      });

      return {
        data: {
          cells,
          bet: game.bet,
          gems: gemCount,
          mines: mineCount,
          multiplier: game.multiplier,
        },
      };
    },

    async reveal({ userId, fields }) {
      return store.transaction(async (transaction) => {
        const game = requireGame(
          await transaction.mines.findGameByUserId(userId)
        );
        let isGameOver = false;

        for (const field of fields) {
          const selected = game.cells[field];
          if (!selected || selected.isRevealed) {
            throw new AppError(
              "One or more of the cells you want to reveal have already been revealed",
              400,
              "INVALID_INPUT"
            );
          }
          selected.isRevealed = true;
          if (!selected.isGem) isGameOver = true;
        }

        if (isGameOver) {
          await transaction.analytics.recordGameResult({
            userId,
            gameType: GAME_TYPES.mines,
            wagered: game.bet,
            payout: 0,
          });
          await transaction.mines.deleteGame(game.id);
          return {
            data: {
              isGameOver: true,
              cells: finalGrid(game.cells),
              multiplier: game.multiplier,
            },
          };
        }

        await transaction.mines.revealCells(game.id, fields);
        let hiddenCells = 0;
        let mineCount = 0;
        const cells = game.cells.map((cell) => {
          if (!cell.isRevealed) {
            hiddenCells++;
            if (!cell.isGem) mineCount++;
            return 0;
          }
          return 1;
        });

        game.multiplier = calculateMultiplier(
          game.multiplier,
          mineCount,
          hiddenCells + fields.length,
          fields.length
        );

        if (hiddenCells > 0 && mineCount / hiddenCells === 1) {
          return cashoutGame(transaction, game, userId);
        }

        await transaction.mines.updateMultiplier(
          game.id,
          game.multiplier
        );
        return {
          data: {
            isGameOver: false,
            cells,
            multiplier: game.multiplier,
          },
        };
      });
    },

    async cashout(userId) {
      return store.transaction(async (transaction) => {
        const game = requireGame(
          await transaction.mines.findGameByUserId(userId)
        );
        return cashoutGame(transaction, game, userId);
      });
    },
  };
}
