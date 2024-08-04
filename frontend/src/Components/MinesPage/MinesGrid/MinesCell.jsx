import React, { useEffect, useState, useRef } from "react";

const MinesCell = ({ gameInProgress, row, col, value, resetCells }) => {
  // Updates when the user reveals this cell
  const cellRef = useRef();

  const [currentValue, setCurrentValue] = useState(0);
  // Reveals if the cell is a mine or a gem
  const revealCell = (e) => {
    const cell = e.target;
    cell.classList.add("expand-cell");
    let resultRetrived = true;
    let isGem = false;

    // Ensures we dont reveal the cell if it has already been revealed
    if (!gameInProgress || value) {
      cell.parentElement.classList.remove("reveal-mine");
      return;
    }

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

  useEffect(() => {
    const cellElement = cellRef.current;

    if (value === 0) return;
    setCurrentValue(value);
    cellElement.classList.add("shrink-cell");

    cellElement.addEventListener(
      "animationend",
      () => {
        if (value === 1) {
          cellElement.parentElement.classList.add("reveal-gem");
        } else if (value === 2) {
          // Reveal a mine
          cellElement.parentElement.classList.add("reveal-mine");
        }

        if (!gameInProgress) {
          cellElement.parentElement.classList.add("small");
        }
      },
      { once: true }
    );
  }, [value, gameInProgress]);

  useEffect(() => {
    if (resetCells) {
      console.log("resetting the cells!");
      const cellElement = cellRef.current;
      cellElement.parentElement.classList.remove("reveal-mine");
      cellElement.parentElement.classList.add("shrink-gem-mine");
    }
  }, [resetCells]);

  return (
    <button
      className="cell-wrapper"
      onClick={(e) => {
        e.target.classList.remove("reveal-mine");
      }}
    >
      <div ref={cellRef} className="cell" onClick={revealCell}></div>
    </button>
  );
};

export default MinesCell;
