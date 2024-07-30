import React from "react";
import "./MinesAmountInput.scss";

const MinesAmountInput = ({ setMinesAmount, loadedMines }) => {
  const defaultMines = 3;
  return (
    <div className="mines-amount-wrapper">
      <label htmlFor="mines-amount-label">Mines</label>
      {!loadedMines ? (
        <>
          <select
            name="minesAmount"
            type="select"
            id="mines-amount-input"
            onChange={(e) => setMinesAmount(e.target.value)}
          >
            {[...Array(24)].map((_, index) => (
              <option
                key={index}
                value={index + 1}
                selected={index + 1 === defaultMines}
              >
                {index + 1}
              </option>
            ))}
          </select>
          <DropdownIcon />
        </>
      ) : (
        <input
          type="text"
          id="mines-amount-input"
          readOnly
          value={loadedMines}
        />
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
