import React, { useEffect, useState, useRef } from "react";
// TODO: add cleanup functions
const MinesCell = ({
  gameInProgress,
  field,
  value,
  resetCells,
  updateGrid,
  endGame,
  setGameIsEnding,
  gameIsEnding,
}) => {
  // Grabs the cell ref to manipulate the cover and the hidden value's classses
  // Alternative approach was to use state for the classnames
  const cellRef = useRef();
  const revealCellEndpoint = "http://localhost:5000/api/v1/mines/reveal";

  // Reveals if the cell is a mine or a gem
  const revealCell = async (e) => {
    if (!gameInProgress) return;
    const cover = e.currentTarget.children[1];

    // TODO: expand-cover needs to run infinitely till fetch complete
    // OPtional TODO: Queue the fetches so that the fetching 2 cells really quickly create an effect that resembles them chaining. look at stake for reference - Debouncing, OPTIONAL, wait till API fetching is implemented
    try {
      const res = await fetch(revealCellEndpoint, {
        credentials: "include",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          field: field,
        }),
      });
      if (!res.ok) {
        const errors = await res.json();
        console.log("Errors: ", errors);
        return;
      }
      const cellData = await res.json();
    } catch (error) {
      console.log("Errors: ", error);
    }
    cover.classList.add("expand-cover");
    cover.addEventListener(
      "animationend",
      () => {
        // Game is ending, dont fetch anything more
        if (gameIsEnding) return;
        const revealedGrid = [
          2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1,
          1, 1,
        ];
        // Fetch if gem or mine then pass it
        // TODO: Remove this temporary random for the actual fetch
        const value = Math.floor(Math.random() * (2 - 1 + 1)) + 1;
        updateGrid(field, value);
        if (value === 2) {
          setGameIsEnding(true);
          cover.addEventListener(
            "animationend",
            () => {
              // Reveal all other cells delay. This delay lets the mine anim play out fully
              const delayEndGame = 250;

              setTimeout(() => {
                endGame(revealedGrid);
                setGameIsEnding(false);
              }, delayEndGame);
            },
            { once: true }
          );
        }
      },
      { once: true }
    );
  };

  useEffect(() => {
    const cell = cellRef.current;
    const cover = cell.children[1];
    const hidden = cell.children[0];

    if (value !== 0) {
      cover.classList.add("shrink-cover");
      cover.addEventListener(
        "animationend",
        () => {
          hidden.classList.add(value === 1 ? "gem" : "mine");
          hidden.classList.add(gameInProgress ? "expand" : "expand-dim");
        },
        { once: true }
      );
    }
  }, [value, gameInProgress]);

  useEffect(() => {
    if (!resetCells) return;
    const cell = cellRef.current;
    const cover = cell.children[1];
    const hidden = cell.children[0];

    cover.classList.add("expand");
    cover.addEventListener(
      "animationend",
      () => {
        hidden.classList.remove("mine");
        hidden.classList.remove("gem");
        hidden.classList.remove("expand-dim");
        hidden.classList.remove("expand");
        cover.classList.remove("shrink-cover");
        cover.classList.remove("expand");
        cover.classList.remove("expand-cover");
      },
      { once: true }
    );
  }, [resetCells]);

  return (
    <button className="cell-wrapper" onClick={revealCell} ref={cellRef}>
      <div className="cell-value"></div>
      <div className="cell-cover"></div>
    </button>
  );
};

export default MinesCell;
