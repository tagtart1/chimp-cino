import React, { useEffect, useState } from "react";
import "./MinesPage.scss";
import MinesGrid from "./MinesGrid/MinesGrid";
import MinesBetControls from "./MinesBetControls/MinesBetControls";

const MinesPage = () => {
  // Test grid - simulates a loadedGrid
  const grid = [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  ];

  const [gameInProgress, setGameInProgress] = useState(false);
  const [loadedGrid, setLoadedGrid] = useState(grid);
  const [betAmount, setBetAmount] = useState(0.0);

  // Toggle to trigger the children cells to reset
  const [resetCells, setResetCells] = useState(false);

  const playGame = () => {
    // Call to api to start a game
    setResetCells(true);
    setGameInProgress(true);
    setLoadedGrid(grid);
  };

  const endGame = (revealedGrid) => {
    // TODO: Ponder if we should fetch the revealed grid here or in child funcs
    // Since every time an action results in the game ending, the API returns the revealed grid
    setResetCells(false);
    setLoadedGrid(revealedGrid);
    setGameInProgress(false);
  };

  const updateGrid = (field, value) => {
    // Update the grid
    const updatedGrid = loadedGrid.map((value) => {
      return value;
    });
    updatedGrid[field] = value;
    setLoadedGrid(updatedGrid);
  };

  const revealRandomCell = () => {
    const unrevealedCoordinates = [];
  };

  useEffect(() => {
    // Test grid - simulates a loadedGrid
    const lgrid = [
      0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    ];

    // Retrieve and load game from API
    // Simulating a loaded game
    // if there is a valid grid, do all this
    setLoadedGrid(lgrid);
    setBetAmount(10);
    setGameInProgress(true);
  }, []);

  return (
    <main className="mines-main">
      <section className="mines-section">
        <MinesBetControls
          loadedBet={betAmount}
          gameInProgress={gameInProgress}
          playGame={playGame}
          endGame={endGame}
          revealRandomCell={revealRandomCell}
        />
        <div className="game-screen-mines">
          <MinesGrid
            gameInProgress={gameInProgress}
            loadedGrid={loadedGrid}
            resetCells={resetCells}
            updateGrid={updateGrid}
            endGame={endGame}
          />
        </div>
      </section>
    </main>
  );
};

export default MinesPage;
