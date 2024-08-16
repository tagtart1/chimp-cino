import React, { useState } from "react";
import "./MinesBetControls.scss";
import MinesBetInput from "./MinesBetInput";
import MinesAmountInput from "./MinesAmountInput";
import TotalGainOutput from "./TotalGainOutput";
import { useUser } from "../../../Contexts/UserProvider";

const MinesBetControls = ({
  loadedBet,
  gameInProgress,

  startGame,
  endGame,
  revealRandomCell,
}) => {
  const startGameEndpoint = "http://localhost:5000/api/v1/mines/games";
  const [betAmount, setBetAmount] = useState(0.0);
  const [minesAmount, setMinesAmount] = useState(3);
  const { user } = useUser();

  const playGame = async () => {
    if (parseFloat(betAmount) <= 0 && gameInProgress) {
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
      const gameData = await resolution.json();
      console.log(gameData);
    } catch (error) {
      console.log(error);
    }

    startGame();
  };

  // Retrive the completed grid, reveals the grid
  const cashout = () => {
    // Should probably have the end game results here to render out each grid cell, mainly used to reset the state of grid to all closed cells

    // Payout
    // Show multiplier popup on grid
    console.log("ending game, you cashed out");
    const revealedGrid = [
      2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1,
    ];

    endGame(revealedGrid);
  };

  return (
    <section className="mines-bet-controls">
      {!gameInProgress ? (
        <>
          <MinesBetInput
            setBetAmount={setBetAmount}
            loadedBet={loadedBet}
            gameInProgress={gameInProgress}
          />
          <MinesAmountInput setMinesAmount={setMinesAmount} loadedMines={0} />
          <button className="play-mines-button" onClick={playGame}>
            Play
          </button>
        </>
      ) : (
        <>
          <MinesBetInput
            loadedBet={loadedBet}
            gameInProgress={gameInProgress}
          />
          <MinesAmountInput loadedMines={minesAmount} />
          <TotalGainOutput totalGain={0} multiplier={1.1} />
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
