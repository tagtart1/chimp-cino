import React from "react";
import "./MinesGrid.scss";
import MinesCell from "./MinesCell";

const MinesGrid = ({ gameInProgress, loadedGrid, resetCells, updateGrid }) => {
  // API THOUGHT: each cell reveal simply fetch that cells result while saving the game, on page reload during an inprogress game then we fetch the entire saved game state and populate the cells with that saved info but there is no need to fetch that during each cell click. Also should return info if the game is lost

  return (
    <div className="mines-grid">
      {loadedGrid.map((arr, row) => {
        return arr.map((value, col) => (
          <MinesCell
            key={row + col}
            gameInProgress={gameInProgress}
            row={row}
            col={col}
            value={value}
            resetCells={resetCells}
            updateGrid={updateGrid}
          />
        ));
      })}
    </div>
  );
};

export default MinesGrid;
