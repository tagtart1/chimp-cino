import React from "react";
import "./MinesAmountInput.scss";

const MinesAmountInput = ({
  setMinesAmount,
  minesAmount,
  gameInProgress,
  gemAmount,
}) => {
  const defaultMines = 3;
  // TODO: if there are loaded mines, we need to make the width not stretch, only 50% to make room for the gems
  return (
    <div className="mines-amount-wrapper">
      {!gameInProgress ? (
        <div>
          <label htmlFor="mines-amount-label">Mines</label>
          <select
            name="minesAmount"
            type="select"
            id="mines-amount-input"
            onChange={(e) => setMinesAmount(e.target.value)}
            defaultValue={!minesAmount ? defaultMines : minesAmount}
          >
            {[...Array(24)].map((_, index) => (
              <option key={index} value={index + 1}>
                {index + 1}
              </option>
            ))}
          </select>
          <DropdownIcon />
        </div>
      ) : (
        <>
          <div>
            <label htmlFor="mines-amount-label">Mines</label>
            <input
              type="text"
              id="mines-amount-input"
              className="in-progress"
              readOnly
              value={minesAmount}
            />
          </div>
          <div>
            <label htmlFor="gems-amount-label">Gems</label>
            <input
              type="text"
              id="gems-amount-input"
              className="in-progress"
              readOnly
              value={gemAmount}
            />
          </div>
        </>
      )}
    </div>
  );
};

const DropdownIcon = () => {
  return (
    <div className="mines-select-arrow-icon">
      <svg fill="currentColor" viewBox="0 0 64 64">
        <path d="M32.271 49.763 9.201 26.692l6.928-6.93 16.145 16.145 16.144-16.144 6.93 6.929-23.072 23.07h-.005Z"></path>
      </svg>
    </div>
  );
};

export default MinesAmountInput;
