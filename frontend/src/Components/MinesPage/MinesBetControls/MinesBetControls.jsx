import React, { useState } from "react";
import "./MinesBetControls.scss";
import MinesBetInput from "./MinesBetInput";
import MinesAmountInput from "./MinesAmountInput";
import TotalGainOutput from "./TotalGainOutput";
import { useUser } from "../../../Contexts/UserProvider";

const MinesBetControls = ({
  betAmount,
  setBetAmount,
  gameInProgress,
  startGame,
  endGame,
  revealRandomCell,
  betMultiplier,
  setMinesAmount,
  minesAmount,
  gemAmount,
}) => {
  const startGameEndpoint = "http://localhost:5000/api/v1/mines/games";
  const cashoutEndpoint = "http://localhost:5000/api/v1/mines/cashout";

  const { user } = useUser();

  const playGame = async () => {
    if (parseFloat(betAmount) <= 0 || gameInProgress) {
      // Make a popup
      return;
    }

    if (!user) {
      // Make the sign in popup or a notif
      return;
    }
    try {
      // Call to api to start a game
      const resolution = await fetch(startGameEndpoint, {
        credentials: "include",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mines: parseInt(minesAmount),
          bet: parseFloat(betAmount),
        }),
      });

      if (!resolution.ok) {
        const errors = await resolution.json();
        console.log("Error:", errors);
        return;
      }
    } catch (error) {
      console.log(error);
    }
    const gems = 25 - minesAmount;
    startGame(gems);
  };

  // Retrive the completed grid, reveals the grid
  const cashout = async () => {
    // Should probably have the end game results here to render out each grid cell, mainly used to reset the state of grid to all closed cells

    // Payout
    // Show multiplier popup on grid
    console.log("ending game, you cashed out");
    try {
      const res = await fetch(cashoutEndpoint, {
        credentials: "include",
        method: "POST",
      });
      if (!res.ok) {
        const errors = await res.json();
        console.log("Error cashing out:", errors);
        return;
      }
      const gameData = await res.json();
      console.log(gameData);
      const revealedGrid = [
        2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1,
        1,
      ];

      endGame(revealedGrid);
    } catch (error) {
      console.log("Cashout catch block", error);
    }
  };

  return (
    <section className="mines-bet-controls">
      {!gameInProgress ? (
        <>
          <MinesBetInput
            setBetAmount={setBetAmount}
            betAmount={betAmount}
            gameInProgress={gameInProgress}
          />
          <MinesAmountInput
            setMinesAmount={setMinesAmount}
            minesAmount={minesAmount}
            gameInProgress={gameInProgress}
            gemAmount={gemAmount}
          />
          <button className="play-mines-button" onClick={playGame}>
            Play
          </button>
        </>
      ) : (
        <>
          <MinesBetInput
            betAmount={betAmount}
            gameInProgress={gameInProgress}
          />
          <MinesAmountInput
            minesAmount={minesAmount}
            gameInProgress={gameInProgress}
            gemAmount={gemAmount}
          />
          <TotalGainOutput
            totalGain={Math.max(
              betAmount * betMultiplier - betAmount,
              0
            ).toFixed(2)}
            multiplier={betMultiplier}
          />
          <button className="random-tile-button" onClick={revealRandomCell}>
            Pick random tile
          </button>
          <button className="play-mines-button" onClick={cashout}>
            Cashout
          </button>
        </>
      )}
    </section>
  );
};

export default MinesBetControls;
