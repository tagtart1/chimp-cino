import React, { useEffect } from "react";
import "./MinesAmountInput.scss";
import { useRef } from "react";

const MinesAmountInput = ({ setBetAmount, loadedBet }) => {
  const betAmountInput = useRef(null);

  const doubleBet = () => {
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

    const zeroInput = () => {
      if (!loadedBet && betInputCopy.value === "") {
        betInputCopy.value = (0).toFixed(2);
      } else if (loadedBet) {
        betInputCopy.value = parseFloat(loadedBet).toFixed(2);
      } else {
        betInputCopy.value = parseFloat(betInputCopy.value).toFixed(2);
      }
    };

    // When loadedBet changes, zero the input if needed
    zeroInput();

    // Ensures a 0 input gets trailing zeros
    if (betInputCopy) betInputCopy.addEventListener("focusout", zeroInput);
    // Cleanup
    return () => {
      betInputCopy.removeEventListener("focusout", zeroInput);
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
          onInput={(e) => {
            setBetAmount(e.target.value);
          }}
        />
        <CoinSVG />
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

const CoinSVG = () => {
  return (
    <div className="coin-input-img">
      <svg fill="none" viewBox="0 0 96 96">
        <path
          d="M48 96c26.51 0 48-21.49 48-48S74.51 0 48 0 0 21.49 0 48s21.49 48 48 48Z"
          fill="#FFC800"
        ></path>
        <path
          d="M48.16 21.92c10.16 0 16.56 4.92 20.32 10.72l-8.68 4.72c-2.28-3.44-6.48-6.16-11.64-6.16-8.88 0-15.36 6.84-15.36 16.12 0 9.28 6.48 16.12 15.36 16.12 4.48 0 8.44-1.84 10.6-3.76v-5.96H45.68v-8.96h23.4v18.76c-5 5.6-12 9.28-20.88 9.28-14.32 0-26.12-10-26.12-25.44C22.08 31.92 33.84 22 48.2 22l-.04-.08Z"
          fill="#473800"
        ></path>
      </svg>
    </div>
  );
};

export default MinesAmountInput;
