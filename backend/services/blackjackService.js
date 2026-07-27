import AppError from "../utils/appError.js";
import secureRandomNumber from "../utils/secureRandomNumber.js";
import {
  checkFor21,
  checkForBust,
  isBlackjack,
  isCardAce,
  isHandSoft,
  validateAceValue,
} from "../utils/deckChecks.js";

const NUMBER_OF_DECKS = 2;

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

async function drawCard(transaction, gameId, hand) {
  const deckCards =
    await transaction.blackjack.listActiveDeckCards(gameId);
  if (deckCards.length === 0) {
    throw new AppError("Deck is empty", 400, "SERVER_ERROR");
  }

  const selected =
    deckCards[secureRandomNumber(0, deckCards.length - 1)];
  const sequence = hand.cards.length
    ? hand.cards[hand.cards.length - 1].sequence + 1
    : 1;
  const card = await transaction.blackjack.moveDeckCardToHand({
    deckCardId: selected.deckCardId,
    handId: hand.id,
    sequence,
  });
  if (!card) {
    throw new AppError("Failed to draw card", 400, "SERVER_ERROR");
  }
  hand.cards.push(card);
  validateAceValue(hand.cards);
  return card;
}

async function drawDealer(transaction, game) {
  const hand = dealerHand(game);
  validateAceValue(hand.cards);
  let handValue = hand.cards.reduce((total, card) => total + card.value, 0);

  while (handValue < 17) {
    await drawCard(transaction, game.id, hand);
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

async function finishAgainstDealer(transaction, game, hands) {
  await transaction.blackjack.setGameOver(game.id);
  const dealer = await drawDealer(transaction, game);
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

async function hitHand(transaction, game, hand) {
  await drawCard(transaction, game.id, hand);
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
  return {
    async newGame({ userId, betAmount }) {
      const bet = Number.parseFloat(betAmount);
      if (!bet) {
        throw new AppError("Could not place bet", 401, "INVALID_BET");
      }

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
          await transaction.blackjack.findGameByUserId(userId);
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
        await transaction.blackjack.createDeck(game.id, NUMBER_OF_DECKS);

        const player = playerHands(game)[0];
        const dealer = dealerHand(game);
        await drawCard(transaction, game.id, player);
        const firstDealerCard = await drawCard(
          transaction,
          game.id,
          dealer
        );
        await drawCard(transaction, game.id, player);
        await drawCard(transaction, game.id, dealer);

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
      return store.transaction(async (transaction) => {
        const game = requireActionGame(
          await transaction.blackjack.findGameByUserId(userId)
        );
        requireInsuranceResolved(game);
        const { activeHand, nextHand } = actionHands(game);
        const hands = [activeHand, nextHand].filter(Boolean);
        const result = await hitHand(transaction, game, activeHand);
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
              (await finishAgainstDealer(transaction, game, hands)).data
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
              (await finishAgainstDealer(transaction, game, hands)).data
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
        return result;
      });
    },

    async stand(userId) {
      return store.transaction(async (transaction) => {
        const game = requireActionGame(
          await transaction.blackjack.findGameByUserId(userId)
        );
        requireInsuranceResolved(game);
        const { activeHand, nextHand } = actionHands(game);
        const hands = [activeHand, nextHand].filter(Boolean);
        let result = { data: { game_winners: [] } };

        if (!nextHand || nextHand.isCompleted || nextHand.isBust) {
          result = await finishAgainstDealer(transaction, game, hands);
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
        return result;
      });
    },

    async double(userId) {
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

        await transaction.blackjack.doubleHandBet(activeHand.id);
        activeHand.bet *= 2;
        const result = await hitHand(transaction, game, activeHand);
        activeHand.isBust = result.data.is_hand_bust;

        if (!nextHand) {
          result.data.is_game_over = true;
          if (activeHand.isBust) {
            await transaction.blackjack.setGameOver(game.id);
            result.data.game_winners = ["dealer"];
          } else {
            Object.assign(
              result.data,
              (await finishAgainstDealer(transaction, game, hands)).data
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
              (await finishAgainstDealer(transaction, game, hands)).data
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
        return result;
      });
    },

    async split(userId) {
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

        const originalResult = await hitHand(
          transaction,
          game,
          activeHand
        );
        const newResult = await hitHand(transaction, game, newHand);
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
            (await finishAgainstDealer(transaction, game, hands)).data
          );
          result.data.payout = await payout(
            transaction,
            userId,
            result.data.game_winners,
            hands
          );
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
          result.data.dealer.cards.pop();
        } else if (dealerBlackjack) {
          await transaction.blackjack.setGameOver(game.id);
          result.data.is_game_over = true;
          result.data.game_winners = ["dealer"];
        } else {
          result.data.dealer.cards.pop();
        }

        await transaction.blackjack.setOfferInsurance(game.id, false);
        return result;
      });
    },
  };
}
