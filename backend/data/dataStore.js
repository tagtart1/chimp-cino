/**
 * @typedef {object} UserRecord
 * @property {number} id
 * @property {string} username
 * @property {string} email
 * @property {string} password
 * @property {number} balance
 * @property {Date|null} lastBonusClaimed
 *
 * @typedef {object} CardRecord
 * @property {number} id
 * @property {string} rank
 * @property {string} suit
 * @property {number} value
 * @property {number} [sequence]
 *
 * @typedef {object} HandRecord
 * @property {number} id
 * @property {boolean} isPlayer
 * @property {boolean} isSelected
 * @property {boolean} isCompleted
 * @property {boolean} isBust
 * @property {number} bet
 * @property {CardRecord[]} cards
 *
 * @typedef {object} BlackjackGameRecord
 * @property {number} id
 * @property {number} userId
 * @property {number} startBet
 * @property {boolean} isGameOver
 * @property {boolean} offerInsurance
 * @property {HandRecord[]} hands
 *
 * @typedef {object} MineCellRecord
 * @property {number} field
 * @property {boolean} isGem
 * @property {boolean} isRevealed
 *
 * @typedef {object} MinesGameRecord
 * @property {number} id
 * @property {number} userId
 * @property {number} bet
 * @property {number} multiplier
 * @property {MineCellRecord[]} cells
 *
 * @typedef {object} UsersRepository
 * @property {function(string): Promise<UserRecord|null>} findByLogin
 * @property {function({username: string, email: string}): Promise<boolean>} exists
 * @property {function({username: string, email: string, password: string, balance: number}): Promise<UserRecord>} create
 *
 * @typedef {object} WalletRepository
 * @property {function(number): Promise<number|null>} getBalance
 * @property {function(number, number): Promise<number|null>} withdrawIfSufficient
 * @property {function(number, number): Promise<number>} credit
 *
 * @typedef {object} BlackjackRepository
 * @property {function(number): Promise<BlackjackGameRecord|null>} findGameByUserId
 * @property {function(number): Promise<{id: number, isGameOver: boolean}|null>} findGameStatusByUserId
 * @property {function({userId: number, bet: number}): Promise<BlackjackGameRecord>} createGame
 * @property {function(number): Promise<void>} deleteGame
 * @property {function(): Promise<CardRecord[]>} listCanonicalCards
 * @property {function(object[]): Promise<number>} addCardsToHands
 * @property {function(number, number): Promise<object>} removeCardFromHand
 * @property {function(object): Promise<HandRecord>} createHand
 * @property {function(number): Promise<number>} countPlayerHands
 * @property {function(number, object): Promise<void>} updateHand
 * @property {function(number): Promise<void>} doubleHandBet
 * @property {function(number, boolean=): Promise<void>} setGameOver
 * @property {function(number, boolean): Promise<void>} setOfferInsurance
 *
 * @typedef {object} MinesRepository
 * @property {function(number): Promise<MinesGameRecord|null>} findGameByUserId
 * @property {function(object): Promise<MinesGameRecord>} createGame
 * @property {function(number, number[]): Promise<void>} revealCells
 * @property {function(number, number): Promise<void>} updateMultiplier
 * @property {function(number): Promise<void>} deleteGame
 *
 * @typedef {object} DataStore
 * @property {function(function(DataStore): Promise<*>): Promise<*>} transaction
 * @property {UsersRepository} users
 * @property {WalletRepository} wallet
 * @property {BlackjackRepository} blackjack
 * @property {MinesRepository} mines
 */

const repositoryMethods = {
  users: ["findByLogin", "exists", "create"],
  wallet: ["getBalance", "withdrawIfSufficient", "credit"],
  blackjack: [
    "findGameByUserId",
    "findGameStatusByUserId",
    "createGame",
    "deleteGame",
    "listCanonicalCards",
    "addCardsToHands",
    "removeCardFromHand",
    "createHand",
    "countPlayerHands",
    "updateHand",
    "doubleHandBet",
    "setGameOver",
    "setOfferInsurance",
  ],
  mines: [
    "findGameByUserId",
    "createGame",
    "revealCells",
    "updateMultiplier",
    "deleteGame",
  ],
};

export class DataStoreError extends Error {
  constructor(message, kind = "UNKNOWN") {
    super(message);
    this.name = "DataStoreError";
    this.kind = kind;
  }
}

/**
 * Runtime assertion for the ORM-independent persistence boundary.
 * Services depend on this shape and never on a Prisma client or model.
 *
 * @param {DataStore} store
 * @returns {DataStore}
 */
export function assertDataStore(store) {
  if (!store || typeof store.transaction !== "function") {
    throw new TypeError("DataStore must implement transaction(work)");
  }

  for (const [repository, methods] of Object.entries(repositoryMethods)) {
    if (!store[repository]) {
      throw new TypeError(`DataStore must expose ${repository}`);
    }

    for (const method of methods) {
      if (typeof store[repository][method] !== "function") {
        throw new TypeError(
          `DataStore ${repository} repository must implement ${method}()`
        );
      }
    }
  }

  return store;
}
