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
  const BATCH_DELAY = 200;
  const [actionsCount, setActionsCount] = useState(0);
  const [timerId, setTimerId] = useState(null);
  const [fields, setFields] = useState([]);

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

  const fetchCells = (fields) => {
    // Add to batch
    // Reset batch timer
    console.log("Making the batch fetch with: ", fields);

    // Use promises.
  };

  const scheduleFetch = (field) => {
    setFields((prevFields) => {
      const fieldsAppended = [...prevFields, field];

      setTimerId((prevId) => {
        if (prevId) {
          clearTimeout(prevId);
        }
        return setTimeout(() => {
          fetchCells(fieldsAppended);
          setFields([]);
          setTimerId(null);
        }, BATCH_DELAY);
      });

      return fieldsAppended;
    });
  };
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
          scheduleFetch={scheduleFetch}
        />
      ))}
    </div>
  );
};

export default MinesGrid;
