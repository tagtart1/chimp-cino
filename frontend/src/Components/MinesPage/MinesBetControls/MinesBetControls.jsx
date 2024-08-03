import React, { useState } from "react";
import "./MinesBetControls.scss";
import MinesBetInput from "./MinesBetInput";
import MinesAmountInput from "./MinesAmountInput";
import TotalGainOutput from "./TotalGainOutput";

const MinesBetControls = ({
  loadedBet,
  gameInProgress,
  setGameInProgress,
  resetGrid,
  playGame,
}) => {
  const [betAmount, setBetAmount] = useState(0.0);
  const [minesAmount, setMinesAmount] = useState(3);
  // TODO: change to only save a loadedMines state, if we load in mines, that means we either have a game already started or just started so display the other UI

  const [loadedMines, setLoadedMines] = useState(0);

  const validateBet = () => {
    if (parseFloat(betAmount) <= 0) {
      // Make a popup
      return;
    }

    playGame();
  };

  return (
    <section className="mines-bet-controls">
      {!gameInProgress ? (
        <>
          <MinesBetInput setBetAmount={setBetAmount} loadedBet={loadedBet} />
          <MinesAmountInput setMinesAmount={setMinesAmount} loadedMines={0} />
          <button className="play-mines-button" onClick={validateBet}>
            Play
          </button>
        </>
      ) : (
        <>
          <MinesBetInput loadedBet={loadedBet} />
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
