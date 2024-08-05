import React, { useState } from "react";
import "./MinesBetControls.scss";
import MinesBetInput from "./MinesBetInput";
import MinesAmountInput from "./MinesAmountInput";
import TotalGainOutput from "./TotalGainOutput";

const MinesBetControls = ({
  loadedBet,
  gameInProgress,

  playGame,
  endGame,
}) => {
  const [betAmount, setBetAmount] = useState(0.0);
  const [minesAmount, setMinesAmount] = useState(3);
  // TODO: change to only save a loadedMines state, if we load in mines, that means we either have a game already started or just started so display the other UI

  const [loadedMines, setLoadedMines] = useState(0);

  const validateBet = () => {
    if (parseFloat(betAmount) <= 0 && gameInProgress) {
      // Make a popup
      return;
    }
    console.log("play the game");
    playGame();
  };

  // Retrive the completed grid, reveals the grid
  const cashout = () => {
    // Should probably have the end game results here to render out each grid cell, mainly used to reset the state of grid to all closed cells

    // Payout
    // Show multiplier popup on grid
    console.log("ending game, you cashed out");
    const revealedGrid = [
      [2, 1, 1, 1, 1],
      [1, 1, 1, 1, 1],
      [1, 2, 1, 1, 1],
      [1, 2, 1, 1, 1],
      [1, 1, 1, 1, 1],
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
          <button className="play-mines-button" onClick={validateBet}>
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
          <button className="random-tile-button">Pick random tile</button>
          <button className="play-mines-button" onClick={cashout}>
            Cashout
          </button>
        </>
      )}
    </section>
  );
};

export default MinesBetControls;
