import React from "react";
import "./MinesGrid.scss";

const MinesGrid = ({ gameInProgress }) => {
  // TODO: Each cell should be its own component, build it in this file
  // TODO: build a coordinate system 5x5 2d array variable to map out the cells.
  const revealCell = (e) => {
    if (!gameInProgress) return;
    const cell = e.target;
    cell.classList.add("expand-cell");
    let resultRetrived = true;
    let isGem = false;

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
