import React, { useEffect, useState } from "react";
import "./MinesPage.scss";
import MinesGrid from "./MinesGrid/MinesGrid";
import MinesBetControls from "./MinesBetControls/MinesBetControls";

const MinesPage = () => {
  // Test grid - simulates a loadedGrid
  const grid = [
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
  ];

  const [gameInProgress, setGameInProgress] = useState(false);
  const [loadedGrid, setLoadedGrid] = useState(grid);
  const [currentGrid, setCurrentGrid] = useState(grid);
  const [betAmount, setBetAmount] = useState(0.0);

  const playGame = () => {
    // Call to api to start a game

    setGameInProgress(true);
    // Example test
  };

  // Retrive the completed grid, reveals the grid
  const cashout = () => {
    // Should probably have the end game results here to render out each grid cell, mainly used to reset the state of grid to all closed cells

    // Payout
    // Show multiplier popup on grid
    endGame();
  };

  const endGame = (isWin) => {
    // End the game
    // Reveal all non revealed cells in grid
  };

  const resetGrid = () => {};

  useEffect(() => {
    // Test grid - simulates a loadedGrid
    const lgrid = [
      [0, 0, 0, 0, 0],
      [0, 1, 0, 0, 0],
      [0, 0, 0, 1, 0],
      [0, 0, 0, 1, 0],
      [0, 0, 0, 0, 0],
    ];

    // Retrieve and load game from API
    // Simulating a loaded game
    setLoadedGrid(lgrid);
    setCurrentGrid(lgrid);
    setBetAmount(10);
    setGameInProgress(true);
  }, []);

  return (
    <main className="mines-main">
      <section className="mines-section">
        <MinesBetControls
          loadedBet={betAmount}
          gameInProgress={gameInProgress}
          setGameInProgress={setGameInProgress}
          playGame={playGame}
          resetGrid={cashout}
        />
        <div className="game-screen-mines">
          <MinesGrid
            gameInProgress={gameInProgress}
            loadedGrid={loadedGrid}
            setCurrentGrid={setCurrentGrid}
          />
        </div>
      </section>
    </main>
  );
};

export default MinesPage;
