import React, { useState } from "react";
import "./MinesBetControls.scss";
import MinesAmountInput from "./MinesAmountInput";

const MinesBetControls = () => {
  const [betAmount, setBetAmount] = useState();

  return (
    <section className="mines-bet-controls">
      <MinesAmountInput setBetAmount={setBetAmount} loadedBet={14} />
    </section>
  );
};

export default MinesBetControls;
