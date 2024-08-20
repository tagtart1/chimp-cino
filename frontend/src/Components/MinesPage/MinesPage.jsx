import React, { useEffect, useState } from "react";
import "./MinesPage.scss";
import MinesGrid from "./MinesGrid/MinesGrid";
import MinesBetControls from "./MinesBetControls/MinesBetControls";

const MinesPage = () => {
  // Test grid - simulates a loadedGrid
  const baseGrid = [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  ];
  const getGameEndpoint = "http://localhost:5000/api/v1/mines/games";

  const [gameInProgress, setGameInProgress] = useState(false);
  const [loadedGrid, setLoadedGrid] = useState(baseGrid);
  const [betAmount, setBetAmount] = useState(0.0);
  const [betMultiplier, setBetMultiplier] = useState(1);

  // When an action anim is happeing like revealing, we need to disable the cashout and pick random tile buttons
  const [disableActions, setDisableActions] = useState(false);

  // Toggle to trigger the children cells to reset
  const [resetCells, setResetCells] = useState(false);

  const startGame = async () => {
    // Show an error to sign in or show the popup

    // Checks if the grid is all hidden, implying that there is no game in progress so dont do the resetCells animation
    if (!loadedGrid.every((value) => value === 0)) setResetCells(true);
    setGameInProgress(true);
    setLoadedGrid(baseGrid);
    setBetMultiplier(1);
  };

  const endGame = (revealedGrid) => {
    setResetCells(false);
    setLoadedGrid(revealedGrid);
    setGameInProgress(false);
  };

  const updateGame = (field, value, multiplier) => {
    const updatedGrid = [...loadedGrid];
    updatedGrid[field] = value;
    setLoadedGrid(updatedGrid);
    setBetMultiplier(parseFloat(multiplier));
  };

  const revealRandomCell = () => {
    // TODO: Ensure that this function can't spammed by waiting for the last one to finish
    // Get all unrevealed cells
    const unrevealedCells = loadedGrid
      .map((value, index) => ({ value, index }))
      .filter((item) => item.value === 0)
      .map((item) => item.index);

    // Pick a random index
    const randomIndex = Math.floor(Math.random() * unrevealedCells.length);
    const randomCellField = unrevealedCells[randomIndex];

    // Grab the grid element
    const parent = document.getElementById("mines-grid");
    // Grab the cells
    const children = Array.from(parent.getElementsByClassName("cell-wrapper"));

    // Get the cell
    const chosenCell = children[randomCellField];

    chosenCell.click();
  };

  useEffect(() => {
    // Test grid - simulates a loadedGrid
    // Retrieve and load game from API
    const fetchGame = async () => {
      const res = await fetch(getGameEndpoint, {
        credentials: "include",
      });
      if (!res.ok) {
        const errors = await res.json();
        if (errors.code !== "NOT_FOUND") {
          console.log("Errors: ", errors);
        }
        return;
      }

      const gameData = await res.json();
      const { cells: grid, bet, mines, gems, multiplier } = gameData.data;
      console.log(gameData.data);
      setGameInProgress(true);
      setBetAmount(parseFloat(bet));
      setLoadedGrid(grid);
      setBetMultiplier(parseFloat(multiplier));
    };
    fetchGame();
  }, []);

  return (
    <main className="mines-main">
      <section className="mines-section">
        <MinesBetControls
          setBetAmount={setBetAmount}
          betAmount={betAmount}
          gameInProgress={gameInProgress}
          startGame={startGame}
          endGame={endGame}
          revealRandomCell={revealRandomCell}
          betMultiplier={betMultiplier}
        />
        <div className="game-screen-mines">
          <MinesGrid
            gameInProgress={gameInProgress}
            loadedGrid={loadedGrid}
            resetCells={resetCells}
            updateGame={updateGame}
            endGame={endGame}
          />
        </div>
      </section>
    </main>
  );
};

export default MinesPage;
