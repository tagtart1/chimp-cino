import React, { useEffect, useRef, useState } from "react";
import "../../BetAmountInput/BetAmountInput.scss";
import CoinIcon from "../../BetAmountInput/CoinIcon";

const MinesBetInput = ({ setBetAmount, betAmount, gameInProgress }) => {
  const betAmountInput = useRef(null);
  const [insideInput, setInsideInput] = useState(false);

  const doubleBet = () => {
    if (gameInProgress) {
      return;
    }
    // Can't double 0 so just set it 1 cent
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
    if (gameInProgress) {
      return;
    }
    if (betAmountInput.current.value === "0.00") {
      return;
    }

    betAmountInput.current.value = (betAmountInput.current.value / 2).toFixed(
      2
    );
    setBetAmount(betAmountInput.current.value);
  };

  useEffect(() => {
    const betInputCopy = betAmountInput.current;
    betInputCopy.value = betAmount;
    const zeroInput = () => {
      if (!betInputCopy.value) {
        betInputCopy.value = (0).toFixed(2);
      } else {
        betInputCopy.value = parseFloat(betInputCopy.value).toFixed(2);
      }
      setInsideInput(false);
    };

    // Ensures a 0 input gets trailing zeros
    if (betInputCopy) betInputCopy.addEventListener("focusout", zeroInput);

    // When betAmount changes, zero the input if needed
    if (!insideInput) zeroInput();
    // Cleanup
    return () => {
      betInputCopy.removeEventListener("focusout", zeroInput);
    };
  }, [betAmount, insideInput]);

  return (
    <div className={`amount-input-group`}>
      <label htmlFor="mines-bet-amount">Amount</label>
      <div className={`input-wrapper ${gameInProgress ? "disabled" : ""}`}>
        <div className="bet-amount-field">
          <input
            ref={betAmountInput}
            className="bet-amount-input"
            type="number"
            id="mines-bet-amount"
            step={0.01}
            onFocus={(event) => event.currentTarget.select()}
            onInput={(e) => {
              setInsideInput(true);
              setBetAmount(e.target.value);
            }}
            disabled={gameInProgress}
          />
          <CoinIcon className="coin-input-img" />
        </div>
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

export default MinesBetInput;
