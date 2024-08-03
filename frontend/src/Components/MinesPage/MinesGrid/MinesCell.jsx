import React, { useEffect, useState } from "react";

const MinesCell = ({ gameInProgress, row, col, value }) => {
  // Updates when the user reveals this cell
  const [currentValue, setCurrentValue] = useState(null);

  // Reveals if the cell is a mine or a gem
  const revealCell = (e) => {
    // Ensures we dont reveal the cell if it has already been revealed
    if (!gameInProgress || value || currentValue) return;
    console.log(`My coordinate is: ${row},${col} with value ${value}`);

    const cell = e.target;
    cell.classList.add("expand-cell");
    let resultRetrived = true;
    let isGem = false;

    // Fetch cell result

    cell.addEventListener(
      "animationend",
      () => {
        if (resultRetrived) {
          cell.classList.add("shrink-cell");

          cell.addEventListener(
            "animationend",
            () => {
              if (isGem) {
                cell.parentElement.classList.add("reveal-gem");
              } else {
                // Reveal a mine
                cell.parentElement.classList.add("reveal-mine");
              }
            },
            { once: true }
          );
        }
      },
      { once: true }
    );
  };

  return (
    <button className="cell-wrapper">
      {!value ? (
        <div className="cell" onClick={revealCell}></div>
      ) : (
        <div className="cell reveal-gem"></div>
      )}
    </button>
  );
};

export default MinesCell;
