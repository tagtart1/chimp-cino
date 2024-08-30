import React, { useEffect, useState, useRef } from "react";
import explosionEffect from "../../../images/mineExplosion.CTwuSNug.gif";
// TODO: add cleanup functions
const MinesCell = ({
  gameInProgress,
  field,
  value,
  resetCells,
  updateGame,
  endGame,
  setGameIsEnding,
  gameIsEnding,
}) => {
  // Grabs the cell ref to manipulate the cover and the hidden value's classses
  // Alternative approach was to use state for the classnames
  const cellRef = useRef();
  const revealCellEndpoint = "http://localhost:5000/api/v1/mines/reveal";
  const [fetched, setFetched] = useState(false);
  const [explode, setExplode] = useState(false);

  // Reveals if the cell is a mine or a gem
  const revealCell = async (e) => {
    if (!gameInProgress || fetched) return;
    const cover = e.currentTarget.querySelector(".cell-cover");

    // TODO: expand-cover needs to run infinitely till fetch complete
    // OPtional TODO: Queue the fetches so that the fetching 2 cells really quickly create an effect that resembles them chaining. look at stake for reference - Debouncing, OPTIONAL, wait till API fetching is implemented

    cover.classList.add("expand-cover");
    setFetched(true);
    cover.addEventListener(
      "animationend",
      async () => {
        // Game is ending, dont fetch anything more
        if (gameIsEnding || fetched) return;

        let cellData = {};
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
          cellData = (await res.json()).data;
        } catch (error) {
          console.log("Errors: ", error);
        }
        const updatedGrid = cellData.cells;
        const newMultiplier = cellData.isGameOver ? 0 : cellData.multiplier;
        const payout = cellData.payout;
        console.log(cellData);
        updateGame(field, updatedGrid[field], newMultiplier);
        if (cellData.isGameOver) {
          console.log("PAYOUT: ", payout);
          setGameIsEnding(true);
          setExplode(payout ? false : true);
          cover.addEventListener(
            "animationend",
            () => {
              // Reveal all other cells delay. This delay lets the mine anim play out fully
              const delayEndGame = 650;

              setTimeout(() => {
                endGame(updatedGrid, payout);
                setGameIsEnding(false);
                setExplode(false);
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
    const cover = cell.querySelector(".cell-cover");
    const hidden = cell.querySelector(".cell-value");

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
    const cover = cell.querySelector(".cell-cover");
    const hidden = cell.querySelector(".cell-value");

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
        setExplode(false);
        setFetched(false);
      },
      { once: true }
    );
  }, [resetCells]);

  return (
    <button className="cell-wrapper" onClick={revealCell} ref={cellRef}>
      {explode && (
        <img
          alt="mine explosion effect"
          className="mine-effect"
          src={`${explosionEffect}?a=${Math.random()}`}
        />
      )}
      <div className="cell-value"></div>
      <div className="cell-cover"></div>
    </button>
  );
};

export default MinesCell;
