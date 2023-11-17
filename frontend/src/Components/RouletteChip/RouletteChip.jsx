import React from "react";
import "./RouletteChip.scss";

const RouletteChip = ({ color, amount, style, showBorder }) => {
  return (
    <div style={style}>
      <div
        className={`roulette-chip ${showBorder === true ? "white-border" : ""}`}
      >
        <div className="amount">{amount}</div>
      </div>
    </div>
  );
};

export default RouletteChip;
