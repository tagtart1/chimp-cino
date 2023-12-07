import React, { useState } from "react";
import "./BlackjackPage.scss";
import { useRef, useEffect } from "react";
import BlackjackActions from "./BlackjackActions/BlackjackActions";
import { PlayingCard } from "../PlayingCard/PlayingCard";
import { delay, motion } from "framer-motion";
import BlackjackCardStack from "./BlackjackCardStack/BlackjackCardStack";
import { useUser } from "../../Contexts/UserProvider";

const BlackjackPage = () => {
  const blackjackStartEndpoint = "http://localhost:5000/api/v1/blackjack/games";
  const blackjackInProgressEndpoint =
    "http://localhost:5000/api/v1/blackjack/games/in-progress";
  const gameScreenRef = useRef(null);
  const betAmountInput = useRef(null);
  const { user } = useUser();
  const [cardsAmount, setCardsAmount] = useState(0);
  const [dealerCardsAmount, setDealerCardsAmount] = useState(1);
  const [playerCards, setPlayerCards] = useState([]);
  const [dealerCards, setDealerCards] = useState([]);
  const [dealerValue, setDealerValue] = useState(0);
  const [playerValue, setPlayerValue] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [gameLoaded, setGameLoaded] = useState(false);

  const thresholdWidth = 875;
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
    // TRICKLE THE STATE
    // SET PLAYER CARD, WAIT .5 SECOND, ADD PLAYER CARD
    dealInitialCards(gameData.data);
    console.log(gameData);
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
      console.log("FINDING GAME");
      try {
        setIsLoading(true);
        const response = await fetch(blackjackInProgressEndpoint, {
          credentials: "include",
          method: "GET",
        });

        if (response.ok) {
          const results = await response.json();

          // Set cards to the array of cards
          setPlayerCards(results.data.player.cards);
          setDealerCards(results.data.dealer.cards);

          // Grab total value
          setDealerValue(getCardValueFromArray(results.data.dealer.cards));
          setPlayerValue(getCardValueFromArray(results.data.player.cards));

          setGameLoaded(true);
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

  const getCardValueFromArray = (cards) => {
    let total = 0;
    for (const card of cards) {
      total += card.value;
    }
    return total;
  };

  const dealInitialCards = async (handData) => {
    const dealerCards = handData.dealer.cards;
    const playerCards = handData.player.cards;

    setPlayerCards((currentCards) => [...currentCards, playerCards[0]]);

    await delay(520);
    setPlayerValue(playerCards[0].value);
    setDealerCards((currentCards) => [...currentCards, dealerCards[0]]);

    await delay(520);
    setDealerValue(dealerCards[0].value);
    setPlayerCards((currentCards) => [...currentCards, playerCards[1]]);
    await delay(520);
    setPlayerValue((oldValue) => oldValue + playerCards[1].value);
  };

  const renderCardStack = (cards, isDealer = false) => {
    return cards.map((card, index) => {
      console.log("Am dealer:", isDealer);
      const style =
        index === 0
          ? { transform: `${gameLoaded ? "rotateY(180deg)" : ""}` }
          : {
              marginTop: `${index}em`,
              marginLeft: "-2.2em",
              transform: `${gameLoaded ? "rotateY(180deg)" : ""}`,
            };

      return (
        <PlayingCard
          key={index}
          style={style}
          nthCard={index}
          suit={card.suit}
          rank={card.rank}
          dealerCard={isDealer}
          staticCard={gameLoaded}
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
          <BlackjackActions />
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
              {dealerCardsMap}
            </motion.div>
          </div>
          <div className="card-group player-side">
            <motion.div
              className="card-stack"
              layout={gameLoaded ? false : "position"}
            >
              {playerValue !== 0 ? (
                <motion.div className="cards-value" layout="position">
                  {playerValue}
                </motion.div>
              ) : null}

              {cardsMap}
            </motion.div>
          </div>
          <BlackjackCardStack />
        </div>
      </section>
      <button
        onClick={() => {
          setCardsAmount((prev) => prev + 1);
        }}
      >
        new card
      </button>

      <button
        onClick={() => {
          setDealerCardsAmount((prev) => prev + 1);
        }}
      >
        test dealer card
      </button>
    </main>
  );
};

export default BlackjackPage;
