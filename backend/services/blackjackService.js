import AppError from "../utils/appError.js";
import { BLACKJACK_RULES } from "../config/blackjackRules.js";
import {
  buildRemainingShoe,
  drawRandomCard,
} from "./blackjackShoe.js";
import {
  checkFor21,
  checkForBust,
  isBlackjack,
  isCardAce,
  isHandSoft,
  validateAceValue,
} from "../utils/deckChecks.js";
import { GAME_TYPES } from "../config/gameTypes.js";

function playerHands(game) {
  return game.hands.filter((hand) => hand.isPlayer);
}

function dealerHand(game) {
  return game.hands.find((hand) => !hand.isPlayer);
}

function actionHands(game) {
  const hands = playerHands(game);
  return {
    activeHand: hands.find((hand) => hand.isSelected),
    nextHand: hands.find((hand) => !hand.isSelected),
  };
}

function requireActionGame(game) {
  if (!game) {
    throw new AppError("Game not found!", 400, "INVALID_SESSION");
  }
  if (game.isGameOver) {
    throw new AppError("Game is already over!", 401, "INVALID_ACTION");
  }
  return game;
}

function requireInsuranceResolved(game) {
  if (game.offerInsurance) {
    throw new AppError("Accept or deny insurance!", 401, "INVALID_ACTION");
  }
}

async function addCardsToHands(transaction, cards) {
  const insertedCount = await transaction.blackjack.addCardsToHands(cards);
  if (insertedCount !== cards.length) {
    throw new AppError("Failed to deal cards", 500, "SERVER_ERROR");
  }
}

async function drawCard(transaction, game, hand, cardCatalog) {
  const remainingShoe = buildRemainingShoe(cardCatalog, game.hands);
  const selected = drawRandomCard(remainingShoe);
  const sequence = hand.cards.length
    ? hand.cards[hand.cards.length - 1].sequence + 1
    : 1;
  const card = { ...selected, sequence };

  await addCardsToHands(transaction, [
    { handId: hand.id, cardId: card.id, sequence },
  ]);
  hand.cards.push(card);
  validateAceValue(hand.cards);
  return card;
}

async function dealInitialCards(transaction, game, cardCatalog) {
  const player = playerHands(game)[0];
  const dealer = dealerHand(game);
  const remainingShoe = buildRemainingShoe(cardCatalog, game.hands);
  const assignments = [];

  for (const hand of [player, dealer, player, dealer]) {
    const selected = drawRandomCard(remainingShoe);
    const sequence = hand.cards.length + 1;
    const card = { ...selected, sequence };
    hand.cards.push(card);
    assignments.push({ handId: hand.id, cardId: card.id, sequence });
  }

  await addCardsToHands(transaction, assignments);
  return dealer.cards[0];
}

async function drawDealer(transaction, game, cardCatalog) {
  const hand = dealerHand(game);
  validateAceValue(hand.cards);
  let handValue = hand.cards.reduce((total, card) => total + card.value, 0);

  while (handValue < 17) {
    await drawCard(transaction, game, hand, cardCatalog);
    validateAceValue(hand.cards);
    handValue = hand.cards.reduce((total, card) => total + card.value, 0);
  }

  return {
    cards: hand.cards,
    handValue,
    isSoft: isHandSoft(hand.cards),
    isBust: checkForBust(hand.cards),
  };
}

async function finishAgainstDealer(transaction, game, hands, cardCatalog) {
  await transaction.blackjack.setGameOver(game.id);
  const dealer = await drawDealer(transaction, game, cardCatalog);
  hands.sort((left, right) => right.id - left.id);

  const winners = hands.map((hand) => {
    validateAceValue(hand.cards);
    const total = hand.cards.reduce((sum, card) => sum + card.value, 0);
    if ((dealer.isBust || dealer.handValue < total) && !hand.isBust) {
      return "player";
    }
    if ((!dealer.isBust && dealer.handValue > total) || hand.isBust) {
      return "dealer";
    }
    return "push";
  });

  return {
    data: {
      dealer: { cards: dealer.cards },
      is_game_over: true,
      game_winners: winners,
    },
  };
}

async function payout(transaction, userId, winners = [], hands = []) {
  let totalPayout = 0;
  for (let index = 0; index < winners.length; index++) {
    if (winners[index] === "push") {
      totalPayout += hands[index].bet;
    } else if (winners[index] === "player") {
      totalPayout += hands[index].bet * 2;
    }
  }
  if (totalPayout > 0) {
    await transaction.wallet.credit(userId, totalPayout);
  }
  return totalPayout;
}

async function swapSelectedHand(
  transaction,
  currentHand,
  nextHand,
  isBust
) {
  await transaction.blackjack.updateHand(currentHand.id, {
    isSelected: false,
    isCompleted: true,
    isBust,
  });
  await transaction.blackjack.updateHand(nextHand.id, {
    isSelected: true,
  });
  currentHand.isSelected = false;
  currentHand.isCompleted = true;
  currentHand.isBust = isBust;
  nextHand.isSelected = true;
}

async function hitHand(transaction, game, hand, cardCatalog) {
  await drawCard(transaction, game, hand, cardCatalog);
  return {
    data: {
      player: { cards: hand.cards },
      is_game_over: false,
      game_winners: [],
      is_hand_bust: checkForBust(hand.cards),
      is_21: checkFor21(hand.cards),
    },
  };
}

export function createBlackjackService(store) {
  let cardCatalogPromise;

  const getCardCatalog = async () => {
    if (!cardCatalogPromise) {
      cardCatalogPromise = store.blackjack
        .listCanonicalCards()
        .then((cards) => {
          if (cards.length !== BLACKJACK_RULES.cardsPerDeck) {
            throw new AppError(
              `Blackjack card catalog must contain ${BLACKJACK_RULES.cardsPerDeck} cards`,
              500,
              "SERVER_ERROR"
            );
          }
          return Object.freeze(cards.map((card) => Object.freeze(card)));
        })
        .catch((error) => {
          cardCatalogPromise = null;
          throw error;
        });
    }
    return cardCatalogPromise;
  };

  return {
    async newGame({ userId, betAmount }) {
      const bet = Number.parseFloat(betAmount);
      if (!bet) {
        throw new AppError("Could not place bet", 401, "INVALID_BET");
      }

      const cardCatalog = await getCardCatalog();
      return store.transaction(async (transaction) => {
        const balance = await transaction.wallet.withdrawIfSufficient(
          userId,
          bet
        );
        if (balance == null) {
          throw new AppError(
            "Could not place bet: Insufficient funds",
            400,
            "INVALID_BET"
          );
        }

        const existing =
          await transaction.blackjack.findGameStatusByUserId(userId);
        if (existing && !existing.isGameOver) {
          throw new AppError(
            "Game already in progress",
            401,
            "INVALID_ACTION"
          );
        }
        if (existing) {
          await transaction.blackjack.deleteGame(existing.id);
        }

        const game = await transaction.blackjack.createGame({
          userId,
          bet,
        });

        const player = playerHands(game)[0];
        const dealer = dealerHand(game);
        const firstDealerCard = await dealInitialCards(
          transaction,
          game,
          cardCatalog
        );

        const dealerBlackjack = isBlackjack(dealer.cards);
        const playerBlackjack = isBlackjack(player.cards);
        const offerInsurance =
          isCardAce(firstDealerCard) &&
          !playerBlackjack &&
          balance >= bet / 2;
        let payoutAmount = 0;
        let gameWinner;

        if (offerInsurance) {
          await transaction.blackjack.setOfferInsurance(game.id, true);
        } else if (dealerBlackjack && playerBlackjack) {
          gameWinner = "push";
          payoutAmount = bet;
        } else if (dealerBlackjack) {
          gameWinner = "dealer";
        } else if (playerBlackjack) {
          gameWinner = "player";
          payoutAmount = bet * 2.5;
        }

        if (payoutAmount > 0) {
          await transaction.wallet.credit(userId, payoutAmount);
        }
        if (gameWinner) {
          await transaction.blackjack.setGameOver(game.id);
          await transaction.analytics.recordGameResult({
            userId,
            gameType: GAME_TYPES.blackjack,
            wagered: game.totalWagered,
            payout: payoutAmount,
          });
        }

        const dealerCards = [...dealer.cards];
        if (!gameWinner) dealerCards.pop();
        validateAceValue(player.cards);
        validateAceValue(dealerCards);

        return {
          data: {
            player: { hands: [player.cards] },
            dealer: { cards: dealerCards },
            is_game_over: Boolean(gameWinner),
            ...(gameWinner ? { game_winners: [gameWinner] } : {}),
            offerInsurance,
            payout: payoutAmount,
          },
        };
      });
    },

    async getGame(userId) {
      const game = requireActionGame(
        await store.blackjack.findGameByUserId(userId)
      );
      const { activeHand, nextHand } = actionHands(game);
      const hands = [];
      let selectedHandIndex = 0;
      validateAceValue(activeHand.cards);
      hands.push(activeHand.cards);

      if (nextHand) {
        if (nextHand.id > activeHand.id) {
          selectedHandIndex = 1;
          hands.unshift(nextHand.cards);
        } else {
          hands.push(nextHand.cards);
        }
      }

      const dealerCards = [...dealerHand(game).cards];
      if (dealerCards.length === 2) dealerCards.pop();
      validateAceValue(dealerCards);

      return {
        data: {
          player: { hands, selectedHandIndex },
          dealer: { cards: dealerCards },
          is_game_over: game.isGameOver,
          bet: game.startBet,
          offerInsurance: game.offerInsurance,
        },
      };
    },

    async hit(userId) {
      const cardCatalog = await getCardCatalog();
      return store.transaction(async (transaction) => {
        const game = requireActionGame(
          await transaction.blackjack.findGameByUserId(userId)
        );
        requireInsuranceResolved(game);
        const { activeHand, nextHand } = actionHands(game);
        const hands = [activeHand, nextHand].filter(Boolean);
        const result = await hitHand(
          transaction,
          game,
          activeHand,
          cardCatalog
        );
        activeHand.isBust = result.data.is_hand_bust;

        if (result.data.is_hand_bust) {
          if (!nextHand) {
            await transaction.blackjack.setGameOver(game.id);
            result.data.game_winners = ["dealer"];
            result.data.is_game_over = true;
          } else if (nextHand.isBust) {
            await transaction.blackjack.setGameOver(game.id);
            result.data.game_winners = ["dealer", "dealer"];
            result.data.is_game_over = true;
          } else if (nextHand.isCompleted) {
            Object.assign(
              result.data,
              (
                await finishAgainstDealer(
                  transaction,
                  game,
                  hands,
                  cardCatalog
                )
              ).data
            );
          } else {
            await swapSelectedHand(
              transaction,
              activeHand,
              nextHand,
              true
            );
            result.data.goToNextHand = true;
          }
        } else if (result.data.is_21) {
          if (!nextHand || nextHand.isBust || nextHand.isCompleted) {
            Object.assign(
              result.data,
              (
                await finishAgainstDealer(
                  transaction,
                  game,
                  hands,
                  cardCatalog
                )
              ).data
            );
          } else {
            await swapSelectedHand(
              transaction,
              activeHand,
              nextHand,
              false
            );
            result.data.goToNextHand = true;
          }
        }

        result.data.payout = await payout(
          transaction,
          userId,
          result.data.game_winners,
          hands
        );
        if (result.data.is_game_over) {
          await transaction.analytics.recordGameResult({
            userId,
            gameType: GAME_TYPES.blackjack,
            wagered: game.totalWagered,
            payout: result.data.payout,
          });
        }
        return result;
      });
    },

    async stand(userId) {
      const cardCatalog = await getCardCatalog();
      return store.transaction(async (transaction) => {
        const game = requireActionGame(
          await transaction.blackjack.findGameByUserId(userId)
        );
        requireInsuranceResolved(game);
        const { activeHand, nextHand } = actionHands(game);
        const hands = [activeHand, nextHand].filter(Boolean);
        let result = { data: { game_winners: [] } };

        if (!nextHand || nextHand.isCompleted || nextHand.isBust) {
          result = await finishAgainstDealer(
            transaction,
            game,
            hands,
            cardCatalog
          );
          result.data.is_game_over = true;
        } else {
          await swapSelectedHand(
            transaction,
            activeHand,
            nextHand,
            false
          );
          result.data.goToNextHand = true;
        }

        result.data.payout = await payout(
          transaction,
          userId,
          result.data.game_winners,
          hands
        );
        if (result.data.is_game_over) {
          await transaction.analytics.recordGameResult({
            userId,
            gameType: GAME_TYPES.blackjack,
            wagered: game.totalWagered,
            payout: result.data.payout,
          });
        }
        return result;
      });
    },

    async double(userId) {
      const cardCatalog = await getCardCatalog();
      return store.transaction(async (transaction) => {
        const game = requireActionGame(
          await transaction.blackjack.findGameByUserId(userId)
        );
        requireInsuranceResolved(game);
        const { activeHand, nextHand } = actionHands(game);
        const hands = [activeHand, nextHand].filter(Boolean);

        if (activeHand.cards.length >= 3) {
          throw new AppError(
            "Cannot double after hitting!",
            401,
            "INVALID_ACTION"
          );
        }
        if (
          (await transaction.wallet.withdrawIfSufficient(
            userId,
            activeHand.bet
          )) == null
        ) {
          throw new AppError(
            "Could not place bet: Insufficient funds",
            401,
            "INVALID_BET"
          );
        }

        await transaction.blackjack.incrementTotalWagered(
          game.id,
          activeHand.bet
        );
        game.totalWagered += activeHand.bet;
        await transaction.blackjack.doubleHandBet(activeHand.id);
        activeHand.bet *= 2;
        const result = await hitHand(
          transaction,
          game,
          activeHand,
          cardCatalog
        );
        activeHand.isBust = result.data.is_hand_bust;

        if (!nextHand) {
          result.data.is_game_over = true;
          if (activeHand.isBust) {
            await transaction.blackjack.setGameOver(game.id);
            result.data.game_winners = ["dealer"];
          } else {
            Object.assign(
              result.data,
              (
                await finishAgainstDealer(
                  transaction,
                  game,
                  hands,
                  cardCatalog
                )
              ).data
            );
          }
        } else if (nextHand.isCompleted || nextHand.isBust) {
          result.data.is_game_over = true;
          if (activeHand.isBust && nextHand.isBust) {
            await transaction.blackjack.setGameOver(game.id);
            result.data.game_winners = ["dealer", "dealer"];
          } else {
            Object.assign(
              result.data,
              (
                await finishAgainstDealer(
                  transaction,
                  game,
                  hands,
                  cardCatalog
                )
              ).data
            );
          }
        } else {
          await swapSelectedHand(
            transaction,
            activeHand,
            nextHand,
            activeHand.isBust
          );
          result.data.goToNextHand = true;
        }

        result.data.payout = await payout(
          transaction,
          userId,
          result.data.game_winners,
          hands
        );
        if (result.data.is_game_over) {
          await transaction.analytics.recordGameResult({
            userId,
            gameType: GAME_TYPES.blackjack,
            wagered: game.totalWagered,
            payout: result.data.payout,
          });
        }
        return result;
      });
    },

    async split(userId) {
      const cardCatalog = await getCardCatalog();
      return store.transaction(async (transaction) => {
        const game = requireActionGame(
          await transaction.blackjack.findGameByUserId(userId)
        );
        requireInsuranceResolved(game);
        const { activeHand } = actionHands(game);
        const initialBet = activeHand.bet;

        if ((await transaction.blackjack.countPlayerHands(game.id)) > 1) {
          throw new AppError(
            "You can only split once!",
            401,
            "INVALID_ACTION"
          );
        }
        if (activeHand.cards.length >= 3) {
          throw new AppError(
            "Cannot split after hitting!",
            401,
            "INVALID_ACTION"
          );
        }
        if (activeHand.cards[0].rank !== activeHand.cards[1].rank) {
          throw new AppError(
            "Cannot split non-pairs",
            401,
            "INVALID_ACTION"
          );
        }
        if (
          (await transaction.wallet.withdrawIfSufficient(
            userId,
            initialBet
          )) == null
        ) {
          throw new AppError(
            "Could not place bet: Insufficient funds",
            401,
            "INVALID_BET"
          );
        }

        await transaction.blackjack.incrementTotalWagered(
          game.id,
          initialBet
        );
        game.totalWagered += initialBet;
        const removed = await transaction.blackjack.removeCardFromHand(
          activeHand.id,
          1
        );
        const movedCard = activeHand.cards.shift();
        const newHand = await transaction.blackjack.createHand({
          gameId: game.id,
          isPlayer: true,
          isSelected: false,
          bet: initialBet,
          card: { cardId: removed.cardId, sequence: 1 },
        });
        newHand.cards = [{ ...movedCard, sequence: 1 }];
        game.hands.push(newHand);

        const originalResult = await hitHand(
          transaction,
          game,
          activeHand,
          cardCatalog
        );
        const newResult = await hitHand(
          transaction,
          game,
          newHand,
          cardCatalog
        );
        const result = {
          data: {
            player: {
              hands: [
                newResult.data.player.cards,
                originalResult.data.player.cards,
              ],
              selectedHandIndex: 1,
            },
            dealer: {},
          },
        };

        if (newResult.data.is_21 && originalResult.data.is_21) {
          const hands = [newHand, activeHand];
          Object.assign(
            result.data,
            (
              await finishAgainstDealer(
                transaction,
                game,
                hands,
                cardCatalog
              )
            ).data
          );
          result.data.payout = await payout(
            transaction,
            userId,
            result.data.game_winners,
            hands
          );
          await transaction.analytics.recordGameResult({
            userId,
            gameType: GAME_TYPES.blackjack,
            wagered: game.totalWagered,
            payout: result.data.payout,
          });
        } else if (originalResult.data.is_21) {
          await swapSelectedHand(
            transaction,
            activeHand,
            newHand,
            false
          );
          result.data.player.selectedHandIndex = 0;
        } else if (newResult.data.is_21) {
          await transaction.blackjack.updateHand(newHand.id, {
            isCompleted: true,
          });
          newHand.isCompleted = true;
        }

        return result;
      });
    },

    async insurance({ userId, acceptInsurance }) {
      if (typeof acceptInsurance !== "boolean") {
        throw new AppError("It's either yes or no!", 401, "INVALID_ACTION");
      }

      return store.transaction(async (transaction) => {
        const game = requireActionGame(
          await transaction.blackjack.findGameByUserId(userId)
        );
        const dealerCards = [...dealerHand(game).cards];
        const dealerBlackjack = isBlackjack(dealerCards);
        const insuranceCost = game.startBet / 2;
        const result = {
          data: {
            dealer: { cards: dealerCards },
            is_game_over: false,
            payout: 0,
          },
        };

        if (acceptInsurance && dealerBlackjack) {
          await transaction.blackjack.setGameOver(game.id);
          await transaction.wallet.credit(userId, game.startBet);
          result.data.is_game_over = true;
          result.data.game_winners = ["push"];
          result.data.payout = game.startBet;
        } else if (acceptInsurance) {
          if (
            (await transaction.wallet.withdrawIfSufficient(
              userId,
              insuranceCost
            )) == null
          ) {
            throw new AppError(
              "Could not place bet: Insufficient funds",
              401,
              "INVALID_BET"
            );
          }
          await transaction.blackjack.incrementTotalWagered(
            game.id,
            insuranceCost
          );
          game.totalWagered += insuranceCost;
          result.data.dealer.cards.pop();
        } else if (dealerBlackjack) {
          await transaction.blackjack.setGameOver(game.id);
          result.data.is_game_over = true;
          result.data.game_winners = ["dealer"];
        } else {
          result.data.dealer.cards.pop();
        }

        await transaction.blackjack.setOfferInsurance(game.id, false);
        if (result.data.is_game_over) {
          await transaction.analytics.recordGameResult({
            userId,
            gameType: GAME_TYPES.blackjack,
            wagered: game.totalWagered,
            payout: result.data.payout,
          });
        }
        return result;
      });
    },
  };
}
