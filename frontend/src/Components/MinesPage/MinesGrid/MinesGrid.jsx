import React, { useEffect, useState } from "react";
import "./MinesGrid.scss";
import MinesCell from "./MinesCell";
import { apiUrl } from "../../../config/api";
import useGameAuth from "../../../Hooks/useGameAuth";

const MinesGrid = ({
  gameInProgress,
  loadedGrid,
  resetCells,
  updateGame,
  endGame,
  setDisableActions,
  setGameIsEnding,
  gameIsEnding,
}) => {
  // Can be adjusted but also matches the animation time to expand the cover
  const BATCH_DELAY = 250;

  const [actionsCount, setActionsCount] = useState(0);
  const [, setTimerId] = useState(null);
  const [, setFields] = useState([]);
  const { handleAuthError } = useGameAuth();

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

  const fetchCells = async (fields) => {
    // Add to batch
    // Reset batch timer
    console.log("Making the batch fetch with: ", fields);

    // Use promises.
    try {
      const res = await fetch(apiUrl("/mines/reveal"), {
        credentials: "include",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fields: fields,
        }),
      });
      if (!res.ok) {
        const errors = await res.json().catch(() => null);
        handleAuthError(errors);
        console.log("Errors: ", errors);
        return;
      }
      const cellData = (await res.json()).data;
      const updatedGrid = cellData.cells;
      const payout = cellData.payout;
      const newMulti = cellData.isGameOver && !payout ? 0 : cellData.multiplier;
      if (cellData.isGameOver) {
        console.log("Is game over", cellData.isGameOver);
        setGameIsEnding(true);
      }
      updateGame(fields, updatedGrid, newMulti, cellData.isGameOver, payout);
    } catch (error) {
      console.log("Errors: ", error);
    } finally {
      setActionsCount((prev) => Math.max(0, prev - fields.length));
    }
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
          gameIsEnding={gameIsEnding}
          setActionsCount={setActionsCount}
          scheduleFetch={scheduleFetch}
        />
      ))}
    </div>
  );
};

export default MinesGrid;
