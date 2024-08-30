import React, { useEffect, useState } from "react";
import "./MinesGrid.scss";
import MinesCell from "./MinesCell";

const MinesGrid = ({
  gameInProgress,
  loadedGrid,
  resetCells,
  updateGame,
  endGame,
  setDisableActions,
}) => {
  const [gameIsEnding, setGameIsEnding] = useState(false);

  // Tracks how many cells are being fetches concurrently, needs to be fiddled with to handle batching the requests but this should help with UX disalbing button
  const [actionsCount, setActionsCount] = useState(0);

  useEffect(() => {
    if (actionsCount > 0) {
      setDisableActions(true);
    } else {
      setDisableActions(false);
    }

    if (!gameInProgress) {
      setActionsCount(0);
    }
  }, [actionsCount, setDisableActions, gameInProgress]);
  return (
    <div id="mines-grid">
      {loadedGrid.map((value, index) => (
        <MinesCell
          key={index}
          gameInProgress={gameInProgress}
          field={index}
          value={value}
          resetCells={resetCells}
          updateGame={updateGame}
          endGame={endGame}
          setGameIsEnding={setGameIsEnding}
          gameIsEnding={gameIsEnding}
          setActionsCount={setActionsCount}
        />
      ))}
    </div>
  );
};

export default MinesGrid;
