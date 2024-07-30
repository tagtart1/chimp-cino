import React, { useState } from "react";
import "./MinesBetControls.scss";
import MinesBetInput from "./MinesBetInput";
import MinesAmountInput from "./MinesAmountInput";

const MinesBetControls = () => {
  const [betAmount, setBetAmount] = useState();
  const [minesAmount, setMinesAmount] = useState(3);

  return (
    <section className="mines-bet-controls">
      <MinesBetInput setBetAmount={setBetAmount} loadedBet={0} />
      <MinesAmountInput setMinesAmount={setMinesAmount} loadedMines={0} />
      <button className="play-mines-button">Play</button>
    </section>
  );
};

export default MinesBetControls;
