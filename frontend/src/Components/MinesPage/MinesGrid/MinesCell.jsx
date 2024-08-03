import React, { useEffect, useState, useRef } from "react";

const MinesCell = ({ gameInProgress, row, col, value }) => {
  // Updates when the user reveals this cell
  const cellRef = useRef();

  // Reveals if the cell is a mine or a gem
  const revealCell = (e) => {
    // Ensures we dont reveal the cell if it has already been revealed
    if (!gameInProgress || value) return;
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

  useEffect(() => {
    const cellElement = cellRef.current;

    if (value === 0) return;

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
      },
      { once: true }
    );
  }, [value]);

  return (
    <button className="cell-wrapper">
      <div ref={cellRef} className="cell" onClick={revealCell}></div>
    </button>
  );
};

export default MinesCell;
