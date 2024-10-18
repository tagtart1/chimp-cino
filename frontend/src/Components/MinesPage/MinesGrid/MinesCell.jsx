import React, { useEffect, useState, useRef } from "react";
import explosionEffect from "../../../images/mineExplosion.CTwuSNug.gif";
import soundManager from "../../../Helpers/sfxPlayer";

// TODO: add cleanup functions
const MinesCell = ({
  gameInProgress,
  field,
  value,
  resetCells,
  updateGame,
  endGame,
  gameIsEnding,
  setActionsCount,
  scheduleFetch,
}) => {
  // Grabs the cell ref to manipulate the cover and the hidden value's classses
  // Alternative approach was to use state for the classnames
  const cellRef = useRef();
  const [fetched, setFetched] = useState(false);
  const [explode, setExplode] = useState(false);
  const [queued, setQueued] = useState(false);

  // Reveals if the cell is a mine or a gem
  const revealCell = async (e) => {
    if (!gameInProgress || fetched) return;
    setActionsCount((prev) => prev + 1);
    const cover = e.currentTarget.querySelector(".cell-cover");

    // TODO: expand-cover needs to run infinitely till fetch complete
    // OPtional TODO: Queue the fetches so that the fetching 2 cells really quickly create an effect that resembles them chaining. look at stake for reference - Debouncing, OPTIONAL, wait till API fetching is implemented

    cover.classList.add("expand-cover");
    setFetched(true);
    if (gameIsEnding || fetched) return;
    scheduleFetch(field);
    setQueued(true);
    cover.addEventListener(
      "animationend",
      async () => {
        // Game is ending, dont fetch anything more
        /** 
        const updatedGrid = cellData.cells;
        const newMultiplier =
          cellData.isGameOver && !cellData.payout ? 0 : cellData.multiplier;
        const payout = cellData.payout;

        if (cellData.isGameOver && !payout) {
          soundManager.playAudio("bomb");
        } else {
          soundManager.playAudio("gem");
        }
        updateGame(field, updatedGrid[field], newMultiplier);

        if (cellData.isGameOver) {
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
        } else {
          setActionsCount((prev) => prev - 1);
        }
           */
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
          const isMine = value === 2;
          if (!isMine && gameInProgress && queued) {
            soundManager.playAudio("gem");
            setQueued(false);
          } else if (isMine && gameIsEnding && queued && !explode) {
            setExplode(true);

            soundManager.playAudio("bomb");
            setQueued(false);
          }
          hidden.classList.add(!isMine ? "gem" : "mine");

          hidden.classList.add(gameInProgress ? "expand" : "expand-dim");
        },
        { once: true }
      );
    }
  }, [value, gameInProgress, gameIsEnding, queued, explode]);

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
        setQueued(false);
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
          src={`${explosionEffect}?a=${value}`}
        />
      )}
      <div className="cell-value"></div>
      <div className="cell-cover"></div>
    </button>
  );
};

export default MinesCell;
