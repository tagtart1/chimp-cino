import React, { useState } from "react";
import "./BlackjackPage.scss";
import { useRef, useEffect } from "react";

const BlackjackPage = () => {
  const gameScreenRef = useRef(null);
  const thresholdWidth = 875;

  useEffect(() => {
    // Scales down the game screen when its width is below the threshold
    const handleResize = () => {
      if (gameScreenRef.current) {
        const width = gameScreenRef.current.offsetWidth;
        if (width < thresholdWidth && width > 535) {
          const widthDifference = thresholdWidth - width;
          const heightReduction = widthDifference * 0.8; // 0.8px reduction for every 1px width reduction
          const newMinHeight = 630 - heightReduction;
          if (gameScreenRef.current) {
            gameScreenRef.current.style.minHeight = newMinHeight + "px";
          }
        } else if (width > thresholdWidth) {
          gameScreenRef.current.style.minHeight = 630 + "px";
        }
      }
    };

    window.addEventListener("resize", handleResize);

    // Initial check
    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <main className="blackjack-main">
      <section className="blackjack-game-section">
        <div className="bet-controls">
          <div className="amount-input-group">
            <label htmlFor="bet-amount">Amount</label>
            <input type="text" id="bet-amount" />
          </div>
          <div className="blackjack-actions">
            <button>Hit</button>
            <button>Stand</button>
            <button>Split</button>
            <button>Double</button>
          </div>
          <button className="blackjack-play-button">Play</button>
        </div>
        <div className="game-screen" ref={gameScreenRef}></div>
      </section>
    </main>
  );
};

export default BlackjackPage;
