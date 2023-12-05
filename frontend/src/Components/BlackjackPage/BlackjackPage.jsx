import React, { useState } from "react";
import "./BlackjackPage.scss";
import { useRef, useEffect } from "react";
import BlackjackActions from "./BlackjackActions/BlackjackActions";
import { PlayingCard } from "../PlayingCard/PlayingCard";
import { motion } from "framer-motion";
import BlackjackCardStack from "./BlackjackCardStack/BlackjackCardStack";

const BlackjackPage = () => {
  const blackjackStartEndpoint = "http://localhost:5000/api/v1/blackjack/start";
  const gameScreenRef = useRef(null);
  const betAmountInput = useRef(null);
  const [cardsAmount, setCardsAmount] = useState(0);
  const [dealerCardsAmount, setDealerCardsAmount] = useState(1);

  const thresholdWidth = 875;
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
    const cards = await res.json();
    // TRICKLE THE STATE
    // SET PLAYER CARD, WAIT .5 SECOND, ADD PLAYER CARD
    console.log(cards);
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
          console.log(mult);

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

  const cards = [...Array(cardsAmount)].map((_, index) => {
    const style =
      index === 0
        ? {}
        : {
            marginTop: `${index}em`,
            marginLeft: "-2.5em",
          };

    return (
      <PlayingCard
        key={index}
        value={index + 2}
        style={style}
        nthCard={index}
      />
    );
  });

  const dealerCards = [...Array(dealerCardsAmount)].map((_, index) => {
    const style =
      index === 0
        ? {}
        : {
            marginTop: `${index}em`,
            marginLeft: "-2.5em",
          };

    return (
      <PlayingCard
        key={index}
        value={index + 2}
        style={style}
        nthCard={index}
        dealerCard={true}
      />
    );
  });

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
            <motion.div className="card-stack" layout="position">
              <motion.div className="cards-value" layout="position">
                21
              </motion.div>
              {dealerCards}
            </motion.div>
          </div>
          <div className="card-group player-side">
            <motion.div className="card-stack" layout="position">
              <motion.div className="cards-value" layout="position">
                21
              </motion.div>
              {cards}
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
