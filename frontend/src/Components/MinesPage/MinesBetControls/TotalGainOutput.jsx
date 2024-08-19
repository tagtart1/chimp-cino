import React from "react";
import "./TotalGainOutput.scss";

const TotalGainOutput = ({ totalGain, multiplier }) => {
  console.log(totalGain);
  return (
    <div className="net-gain-output-wrapper">
      <label htmlFor=""> {`Total net gain (${multiplier}×)`}</label>
      <input
        id="net-gain-output-input"
        type="text"
        readOnly
        value={totalGain}
      />
    </div>
  );
};

export default TotalGainOutput;
