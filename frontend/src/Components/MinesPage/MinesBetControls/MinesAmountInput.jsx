import React from "react";
import "./MinesAmountInput.scss";

const MinesAmountInput = () => {
  return (
    <div className="amount-input-group">
      <label htmlFor="bet-amount">Amount</label>
      <div className="input-wrapper">
        <input type="number" id="bet-amount" step={0.01} />
        <div className="bet-buttons">
          <button className="half-bet-button">½</button>
          <button className="double-bet-button">2×</button>
        </div>
      </div>
    </div>
  );
};

export default MinesAmountInput;
