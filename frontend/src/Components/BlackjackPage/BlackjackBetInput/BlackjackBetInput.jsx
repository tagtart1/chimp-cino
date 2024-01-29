import React, { useEffect, useState } from "react";
import { useRef } from "react";

export const BlackjackBetInput = ({ setBetAmount, loadedBet }) => {
  const betAmountInput = useRef(null);

  // Due to behavior with number input elements, we cannot use state
  // and assign a value directly to the value attr on input in the JSX return
  const doubleBet = () => {
    if (betAmountInput.current.value === "0.00") {
      betAmountInput.current.value = 0.01;
      return;
    }
    betAmountInput.current.value = (betAmountInput.current.value * 2).toFixed(
      2
    );

    setBetAmount(betAmountInput.current.value);
  };

  const halfBet = () => {
    if (betAmountInput.current.value === "0.00") {
      return;
    }

    betAmountInput.current.value = (betAmountInput.current.value / 2).toFixed(
      2
    );

    setBetAmount(betAmountInput.current.value);
  };

  useEffect(() => {
    const betAmountInputCopy = betAmountInput.current;
    betAmountInputCopy.value = loadedBet;
    const handleZeroingInput = () => {
      if (!betAmountInputCopy.value) {
        betAmountInputCopy.value = (0).toFixed(2);
      } else {
        // Formats value to have trail ing 0's
        betAmountInputCopy.value = parseFloat(betAmountInputCopy.value).toFixed(
          2
        );
      }
    };

    if (betAmountInputCopy)
      betAmountInputCopy.addEventListener("focusout", handleZeroingInput);

    handleZeroingInput();

    return () => {
      betAmountInputCopy.removeEventListener("focusout", handleZeroingInput);
    };
  }, [loadedBet]);

  return (
    <div className="amount-input-group">
      <label htmlFor="bet-amount">Amount</label>
      <div className="input-wrapper">
        <input
          ref={betAmountInput}
          type="number"
          id="bet-amount"
          step={0.01}
          onInput={(e) => setBetAmount(e.target.value)}
        />
        <div className="bet-buttons">
          <button className="half-bet-button" onClick={halfBet}>
            ½
          </button>
          <button className="double-bet-button" onClick={doubleBet}>
            2×
          </button>
        </div>
      </div>
    </div>
  );
};
