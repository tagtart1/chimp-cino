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
  const [gameIsEnding, setGameIsEnding] = useState(false);

  return (
    <div id="mines-grid">
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
