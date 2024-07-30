import React, { useState } from "react";
import "./MinesBetControls.scss";
import MinesBetInput from "./MinesBetInput";
import MinesAmountInput from "./MinesAmountInput";

const MinesBetControls = () => {
  const [betAmount, setBetAmount] = useState();
  const [minesAmount, setMinesAmount] = useState(3);
  // TODO: change to only save a loadedMines state, if we load in mines, that means we either have a game already started or just started so display the other UI
  const [started, setStarted] = useState(false);

  const playGame = () => {
    // Call to api to start a game

    setStarted(true);
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
        <div></div>
      )}
    </section>
  );
};

export default MinesBetControls;
