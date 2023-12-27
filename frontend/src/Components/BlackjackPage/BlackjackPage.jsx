import React, { useState } from "react";
import "./BlackjackPage.scss";
import { useRef, useEffect } from "react";
import BlackjackActions from "./BlackjackActions/BlackjackActions";
import { PlayingCard } from "../PlayingCard/PlayingCard";
import { motion, AnimatePresence } from "framer-motion";
import BlackjackCardStack from "./BlackjackCardStack/BlackjackCardStack";
import { useUser } from "../../Contexts/UserProvider";

// TODO: MODULARIZE THIS COMPONENT TOO MUCH STUFF HERE

const BlackjackPage = () => {
  const blackjackStartEndpoint = "http://localhost:5000/api/v1/blackjack/games";
  const blackjackInProgressEndpoint =
    "http://localhost:5000/api/v1/blackjack/games/in-progress";
  const gameScreenRef = useRef(null);
  const betAmountInput = useRef(null);
  const { user, setUser } = useUser();

  const [playerCards, setPlayerCards] = useState([]);
  const [dealerCards, setDealerCards] = useState([]);
  const [dealerValue, setDealerValue] = useState(0);
  const [playerValue, setPlayerValue] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [gameLoaded, setGameLoaded] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [gameWinner, setGameWinner] = useState();

  const thresholdWidth = 875;
  // Use this to delay actions for animation to run smooth
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  // Due to behavior with number input elements, we cannot use state
  // and assign a value directly to the value attr on input in the JSX return
  const doubleBet = () => {
    if (betAmountInput.current.value === "0.00") {
      betAmountInput.current.value = 0.01;
      return;
    }
    betAmountInput.current.value = (betAmountInput.current.value * 2).toFixed(
      2
    );
  };

  const halfBet = () => {
    if (betAmountInput.current.value === "0.00") {
      return;
    }

    betAmountInput.current.value = (betAmountInput.current.value / 2).toFixed(
      2
    );
  };

  const playGame = async () => {
    const res = await fetch(blackjackStartEndpoint, {
      credentials: "include",
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        betAmount: betAmountInput.current.value,
      }),
    });

    if (!res.ok) {
      const errors = await res.json();
      console.log("Error", errors);
      return;
    }
    const gameData = await res.json();
    // Change UI balance
    setUser((prev) => {
      const newCosmeticBal = { ...prev };

      newCosmeticBal.balance -= betAmountInput.current.value;
      return newCosmeticBal;
    });
    if (gameOver) {
      setDealerValue(0);
      setPlayerValue(0);

      setGameLoaded(false);
      setGameOver(false);
      setGameWinner("");
      setDealerCards([]);
      setPlayerCards([]);

      await delay(1000);
    }

    // TRICKLE THE STATE
    // SET PLAYER CARD, WAIT .5 SECOND, ADD PLAYER CARD
    dealInitialCards(gameData);
  };

  useEffect(() => {
    const betAmountInputCopy = betAmountInput.current;

    // Scales down the game screen when its width is below the threshold
    // Calculation numbers may need changing once we add nav bar to the left
    const handleResize = () => {
      if (gameScreenRef.current) {
        const width = gameScreenRef.current.offsetWidth;
        if (width < thresholdWidth && width > 535) {
          const widthDifference = thresholdWidth - width;
          const heightReduction = widthDifference * 0.8; // 0.8px reduction for every 1px width reduction
          const newMinHeight = 630 - heightReduction;

          // Calcualte font size
          const range = thresholdWidth - 535;
          const difference = width - 535;
          const mult = (difference / range) * 0.44 + 0.56;

          if (gameScreenRef.current) {
            gameScreenRef.current.style.minHeight = newMinHeight + "px";
            gameScreenRef.current.style.fontSize = mult + "em";
          }
        } else if (width > thresholdWidth) {
          gameScreenRef.current.style.minHeight = 630 + "px";
          gameScreenRef.current.style.fontSize = 1 + "em";
        }
      }
    };

    const handleZeroingInput = () => {
      if (!betAmountInputCopy.value) {
        betAmountInputCopy.value = (0).toFixed(2);
      } else {
        // Formats value to have trail ing 0's
        betAmountInputCopy.value = parseFloat(betAmountInputCopy.value).toFixed(
          2
        );
      }
    };

    window.addEventListener("resize", handleResize);
    if (betAmountInputCopy)
      betAmountInputCopy.addEventListener("focusout", handleZeroingInput);

    // Initial check
    handleResize();
    handleZeroingInput();
    return () => {
      betAmountInputCopy.removeEventListener("focusout", handleZeroingInput);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    const getGame = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(blackjackInProgressEndpoint, {
          credentials: "include",
          method: "GET",
        });

        if (response.ok) {
          const results = await response.json();
          if (results.data.is_game_over) {
            return;
          }
          // Check if game is new to send a blank
          if (results.data.dealer.cards.length === 1) {
            results.data.dealer.cards.push({ isStatic: true, isBlank: true });
          }
          // Set cards to the array of cards
          for (const card of results.data.player.cards) {
            card.isStatic = true;
          }
          for (const card of results.data.dealer.cards) {
            card.isStatic = true;
          }
          setGameLoaded(true);

          setPlayerCards(results.data.player.cards);
          setDealerCards(results.data.dealer.cards);

          // Grab total value

          setDealerValue(getCardValueFromArray(results.data.dealer.cards));
          setPlayerValue(getCardValueFromArray(results.data.player.cards));
          betAmountInput.current.value = results.data.bet;
        } else {
          console.log("No game found");
        }
      } catch (err) {
        console.log(err);
      } finally {
        setIsLoading(false);
      }
    };

    getGame();
  }, []);

  // Once game loads the cards into the card states we turn of the game is loaded
  useEffect(() => {
    setGameLoaded(false);
  }, [playerCards, dealerCards]);

  const getCardValueFromArray = (cards) => {
    let total = 0;
    let aceCount = 0;

    validateAceValue(cards);
    const isSoft = isHandSoft(cards);

    for (const card of cards) {
      // checking for null card catches the last null in array if there is
      total += card.value || 0;
      if (card.rank === "A") aceCount++;
    }
    if (cards.length === 1 && aceCount === 0) {
      return total;
    }
    if (cards.length === 1 && aceCount === 1 && isSoft) {
      return `1, 11`;
    }
    if (isSoft && aceCount > 0) {
      return `${total - 10}, ${total}`;
    }
    return total;
  };

  const validateAceValue = (cards, isDealer) => {
    let totalValue = 0;
    for (const card of cards) {
      totalValue += card.value;
      if (totalValue > 21) {
        const ace = cards.find((c) => c.rank === "A" && c.value === 11);
        if (ace) {
          ace.value = 1;
          totalValue -= 10;
        }
      }
    }
  };

  // The delay matches the animation speed it takes to get in position
  const dealInitialCards = async (gameData) => {
    const dealerCards = gameData.data.dealer.cards;
    const playerCards = gameData.data.player.cards;

    playerCards.forEach((card) => {
      if (card.value === 1) {
        card.value = 11;
      }
    });

    dealerCards.forEach((card) => {
      if (card.value === 1) {
        card.value = 11;
      }
    });

    setPlayerCards((currentCards) => [...currentCards, playerCards[0]]);

    await delay(520);
    setPlayerValue(getCardValueFromArray([playerCards[0]]));
    setDealerCards((currentCards) => [...currentCards, dealerCards[0]]);

    await delay(520);
    setDealerValue(getCardValueFromArray([dealerCards[0]]));
    setPlayerCards((currentCards) => [...currentCards, playerCards[1]]);
    await delay(520);
    setDealerCards((currentCards) => [
      ...currentCards,
      { isStatic: false, isBlank: true },
    ]);
    setPlayerValue(getCardValueFromArray([playerCards[0], playerCards[1]]));

    if (gameData.data.is_game_over) {
      let dealerValue;

      setDealerCards((currentCards) => {
        let newCards = [...currentCards];
        newCards[1] = dealerCards[1];

        currentCards[1] = dealerCards[1];

        dealerValue = getCardValueFromArray(newCards);
        return newCards;
      });
      await delay(520);
      setDealerValue(dealerValue);
      await delay(520);
      setGameOver(true);
      setGameWinner(gameData.data.game_winner);
      // BUG: FIX PUSH VALUE UPDATES
      setUser((prev) => {
        const user = { ...prev };
        console.log(gameData.data.payout);
        user.balance += gameData.data.payout;
        return user;
      });
    }
  };

  const handleActionResults = async (results, isHit, isDoubled) => {
    if (isDoubled) {
      setUser((prev) => {
        const user = { ...prev };

        user.balance -= betAmountInput.current.value;

        return user;
      });
    }

    if (isHit) {
      const card = results.player.cards[results.player.cards.length - 1];
      await dealNewCard(
        results.player.cards.slice(0, results.player.cards.length - 1),
        true,
        results.player.is_soft,
        card
      );
    }

    if (results.dealer && results.is_game_over) {
      // Show dealer cards
      for (let i = 1; i < results.dealer.cards.length; i++) {
        await dealNewCard(
          results.dealer.cards.slice(0, i),
          false,
          results.dealer.is_soft,
          results.dealer.cards[i]
        );
        await delay(520);
      }
    }

    if (results.is_game_over) {
      await delay(520);
      setGameOver(true);
      setGameWinner(results.game_winner);

      if (!results.payout) return;
      setUser((prev) => {
        const user = { ...prev };

        user.balance += results.payout;

        return user;
      });
    }
  };

  const dealNewCard = async (hand, isPlayer, isSoft, card) => {
    setGameLoaded(false);
    let newValue;
    if (isPlayer) {
      setPlayerCards((currentCards) => {
        newValue = getCardValueFromArray([...hand, card]);
        return [...currentCards, card];
      });
      await delay(520);
      setPlayerValue(newValue);
    } else if (!isPlayer) {
      setDealerCards((currentCards) => {
        // Find the index of the first null element
        const nullIndex = currentCards.findIndex(
          (card) => card.isBlank === true
        );

        // Replace the first null element if it exists, otherwise add the new card to the end
        if (nullIndex !== -1) {
          let newCards = [...currentCards];
          console.log("BLANK TO card: ", newCards);
          newCards[nullIndex] = card;

          newValue = getCardValueFromArray(newCards);

          return newCards;
        } else {
          newValue = getCardValueFromArray([...hand, card]);
          return [...currentCards, card];
        }
      });
      await delay(520);
      setDealerValue(newValue);
    }
  };

  const isHandSoft = (cards) => {
    // Checks for ace
    let hasAce = false;
    let totalValue = 0;
    for (const card of cards) {
      totalValue += card.value || 0;

      if (card.rank === "A" && card.value === 11) {
        hasAce = true;
      }
    }

    if (hasAce && totalValue < 21) {
      console.log("soft");
      return true;
    } else {
      return false;
    }
  };

  const renderCardStack = (cards, isDealer = false) => {
    return cards.map((card, index) => {
      const style =
        index === 0
          ? { transform: `${card.isStatic ? "rotateY(180deg)" : ""}` }
          : {
              marginTop: `${index}em`,
              marginLeft: "-2.2em",
              transform: `${
                card.isStatic && card.value ? "rotateY(180deg)" : ""
              }`,
            };
      if (!card.value)
        return (
          <PlayingCard
            key={index}
            style={style}
            nthCard={index}
            isBlank={true}
            dealerCard={isDealer}
            staticCard={card.isStatic}
          />
        );

      return (
        <PlayingCard
          key={index}
          style={style}
          nthCard={index}
          suit={card.suit}
          rank={card.rank}
          dealerCard={isDealer}
          staticCard={card.isStatic}
          gameResults={gameWinner}
        />
      );
    });
  };

  const cardsMap = renderCardStack(playerCards);

  const dealerCardsMap = renderCardStack(dealerCards, true);

  return (
    <main className="blackjack-main">
      <section className="blackjack-game-section">
        <div className="bet-controls">
          <div className="amount-input-group">
            <label htmlFor="bet-amount">Amount</label>
            <div className="input-wrapper">
              <input
                ref={betAmountInput}
                type="number"
                id="bet-amount"
                step={0.01}
              />
              <div className="bet-buttons">
                <button className="half-bet-button" onClick={halfBet}>
                  ½
                </button>
                <button className="double-bet-button" onClick={doubleBet}>
                  2×
                </button>
              </div>
            </div>
          </div>
          <BlackjackActions handleAction={handleActionResults} />
          <button className="blackjack-play-button" onClick={playGame}>
            Play
          </button>
        </div>
        <div className="game-screen" ref={gameScreenRef}>
          <div className="card-group dealer-side">
            <motion.div
              className="card-stack"
              layout={gameLoaded ? false : "position"}
            >
              {dealerValue !== 0 ? (
                <motion.div className="cards-value" layout="position">
                  {dealerValue}
                </motion.div>
              ) : null}
              <AnimatePresence>
                {dealerCards.length > 0 && dealerCardsMap}
              </AnimatePresence>
            </motion.div>
          </div>
          <div className="card-group player-side">
            <motion.div
              className="card-stack"
              layout={gameLoaded ? false : "position"}
            >
              {playerValue !== 0 ? (
                <motion.div
                  className="cards-value"
                  layout="position"
                  animate={{
                    backgroundColor:
                      gameWinner === "player"
                        ? "#1FFF20"
                        : gameWinner === "dealer"
                        ? "#E9113C"
                        : gameWinner === "push"
                        ? "#FF9D00"
                        : "#2F4553",
                    color:
                      gameOver && gameWinner !== "dealer" ? "#000" : "#FFF",
                    transition: { duration: 0.2 },
                  }}
                >
                  {playerValue}
                </motion.div>
              ) : null}
              <AnimatePresence>
                {playerCards.length > 0 && cardsMap}
              </AnimatePresence>
            </motion.div>
          </div>
          <BlackjackCardStack />
        </div>
      </section>
    </main>
  );
};

export default BlackjackPage;
