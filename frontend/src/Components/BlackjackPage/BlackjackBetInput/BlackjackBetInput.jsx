import React, { useEffect, useRef } from "react";
import "../../BetAmountInput/BetAmountInput.scss";
import CoinIcon from "../../BetAmountInput/CoinIcon";

export const BlackjackBetInput = ({
  setBetAmount,
  loadedBet,
  disabled = false,
}) => {
  const betAmountInput = useRef(null);

  // Due to behavior with number input elements, we cannot use state
  // and assign a value directly to the value attr on input in the JSX return
  const doubleBet = () => {
    if (disabled) return;
    if (betAmountInput.current.value === "0.00") {
      betAmountInput.current.value = 0.01;
      setBetAmount(betAmountInput.current.value);
      return;
    }
    betAmountInput.current.value = (betAmountInput.current.value * 2).toFixed(
      2
    );

    setBetAmount(betAmountInput.current.value);
  };

  const halfBet = () => {
    if (disabled) return;
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
      <label htmlFor="blackjack-bet-amount">Amount</label>
      <div className={`input-wrapper ${disabled ? "disabled" : ""}`}>
        <div className="bet-amount-field">
          <input
            ref={betAmountInput}
            className="bet-amount-input"
            type="number"
            id="blackjack-bet-amount"
            step={0.01}
            onFocus={(event) => event.currentTarget.select()}
            onInput={(e) => setBetAmount(e.target.value)}
            disabled={disabled}
          />
          <CoinIcon className="coin-input-img" />
        </div>
        <div className="bet-buttons">
          <button
            className="half-bet-button"
            onClick={halfBet}
            disabled={disabled}
          >
            ½
          </button>
          <button
            className="double-bet-button"
            onClick={doubleBet}
            disabled={disabled}
          >
            2×
          </button>
        </div>
      </div>
    </div>
  );
};
