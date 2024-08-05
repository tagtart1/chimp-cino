import React, { useState } from "react";
import "./MinesGrid.scss";
import MinesCell from "./MinesCell";

const MinesGrid = ({
  gameInProgress,
  loadedGrid,
  resetCells,
  updateGrid,
  endGame,
}) => {
  // API THOUGHT: each cell reveal simply fetch that cells result while saving the game, on page reload during an inprogress game then we fetch the entire saved game state and populate the cells with that saved info but there is no need to fetch that during each cell click. Also should return info if the game is lost
  const [gameIsEnding, setGameIsEnding] = useState(false);

  return (
    <div className="mines-grid">
      {loadedGrid.map((value, index) => (
        <MinesCell
          key={index}
          gameInProgress={gameInProgress}
          field={index}
          value={value}
          resetCells={resetCells}
          updateGrid={updateGrid}
          endGame={endGame}
          setGameIsEnding={setGameIsEnding}
          gameIsEnding={gameIsEnding}
        />
      ))}
    </div>
  );
};

export default MinesGrid;
