import React, { useState } from "react";
import "./MinesBetControls.scss";
import MinesBetInput from "./MinesBetInput";
import MinesAmountInput from "./MinesAmountInput";
import TotalGainOutput from "./TotalGainOutput";

const MinesBetControls = ({ gameInProgress, setGameInProgress }) => {
  const [betAmount, setBetAmount] = useState();
  const [minesAmount, setMinesAmount] = useState(3);
  // TODO: change to only save a loadedMines state, if we load in mines, that means we either have a game already started or just started so display the other UI

  const [loadedMines, setLoadedMines] = useState(0);

  const playGame = () => {
    // Call to api to start a game
    if (parseFloat(betAmount) <= 0) {
      return;
    }
    setGameInProgress(true);
    // Example test
  };

  const resetGrid = () => {
    // Should probably have the end game results here to render out each grid cell, mainly used to reset the state of grid to all closed cells
  };

  return (
    <section className="mines-bet-controls">
      {!gameInProgress ? (
        <>
          <MinesBetInput setBetAmount={setBetAmount} loadedBet={0} />
          <MinesAmountInput setMinesAmount={setMinesAmount} loadedMines={0} />
          <button className="play-mines-button" onClick={playGame}>
            Play
          </button>
        </>
      ) : (
        <>
          <MinesBetInput loadedBet={betAmount} />
          <MinesAmountInput loadedMines={minesAmount} />
          <TotalGainOutput totalGain={0} multiplier={1.1} />
          <button className="random-tile-button">Pick random tile</button>
          <button className="play-mines-button" onClick={resetGrid}>
            Cashout
          </button>
        </>
      )}
    </section>
  );
};

export default MinesBetControls;
