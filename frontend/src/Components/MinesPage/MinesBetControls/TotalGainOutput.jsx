import React from "react";
import "./TotalGainOutput.scss";

const TotalGainOutput = ({ totalGain, multiplier }) => {
  return (
    <div className="net-gain-output-wrapper">
      <label htmlFor=""> {`Total net gain (${multiplier.toFixed(2)}×)`}</label>
      <input
        id="net-gain-output-input"
        type="text"
        readOnly
        value={totalGain.toFixed(2)}
      />
    </div>
  );
};

export default TotalGainOutput;
