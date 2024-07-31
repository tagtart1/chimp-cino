import React, { useState } from "react";
import "./MinesBetControls.scss";
import MinesBetInput from "./MinesBetInput";
import MinesAmountInput from "./MinesAmountInput";

const MinesBetControls = () => {
  const [betAmount, setBetAmount] = useState();
  const [minesAmount, setMinesAmount] = useState(3);
  // TODO: change to only save a loadedMines state, if we load in mines, that means we either have a game already started or just started so display the other UI
  const [started, setStarted] = useState(false);
  const [loadedMines, setLoadedMines] = useState(0);

  const playGame = () => {
    // Call to api to start a game
    if (parseFloat(betAmount) <= 0) {
      return;
    }
    setStarted(true);
    // Example test
  };

  return (
    <section className="mines-bet-controls">
      {!started ? (
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
          <button className="play-mines-button">Cashout</button>
        </>
      )}
    </section>
  );
};

export default MinesBetControls;
