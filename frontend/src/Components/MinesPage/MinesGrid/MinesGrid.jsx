import React from "react";
import "./MinesGrid.scss";

const MinesGrid = () => {
  const revealCell = (e) => {
    const cell = e.target;
    cell.classList.add("expand-cell");
    let resultRetrived = true;
    let isGem = true;

    // Fetch cell result

    // Once the cell is fully expanded and the result has been fetched, reveal the gem or mine
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
    <div className="mines-grid">
      {[...Array(25)].map((_, index) => (
        <button className="cell-wrapper">
          <div className="cell" onClick={revealCell}></div>
        </button>
      ))}
    </div>
  );
};

export default MinesGrid;
