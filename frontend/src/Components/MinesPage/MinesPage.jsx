import React, { useEffect, useState } from "react";
import "./MinesPage.scss";
import MinesGrid from "./MinesGrid/MinesGrid";
import MinesBetControls from "./MinesBetControls/MinesBetControls";
import { useUser } from "../../Contexts/UserProvider";
import GameWinPopup from "../GameWinPopup/GameWinPopup";
import GameFooter from "../GameFooter/GameFooter";
import { apiUrl } from "../../config/api";

const MinesPage = () => {
  // Test grid - simulates a loadedGrid
  const baseGrid = [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  ];
  const [gameInProgress, setGameInProgress] = useState(false);
  const [gameIsEnding, setGameIsEnding] = useState(false);
  const [loadedGrid, setLoadedGrid] = useState(baseGrid);
  const [betAmount, setBetAmount] = useState(0.0);
  const [minesAmount, setMinesAmount] = useState(3);
  const [gemAmount, setGemAmount] = useState(0);
  const [betMultiplier, setBetMultiplier] = useState(1);
  const [finalPayout, setFinalPayout] = useState(0);
  const [isLoadingGame, setIsLoadingGame] = useState(true);
  const { user, setUser } = useUser();
  const isAuthenticated = Boolean(user);

  // When an action anim is happeing like revealing, we need to disable the cashout and pick random tile buttons
  const [disableActions, setDisableActions] = useState(false);

  // Toggle to trigger the children cells to reset
  const [resetCells, setResetCells] = useState(false);

  const startGame = async (gems) => {
    // Show an error to sign in or show the popup

    // Checks if the grid is all hidden, implying that there is no game in progress so dont do the resetCells animation
    if (!loadedGrid.every((value) => value === 0)) setResetCells(true);
    setGameInProgress(true);
    setLoadedGrid(baseGrid);
    setGemAmount(gems);
    setBetMultiplier(1);
    setFinalPayout(0);
    setDisableActions(false);
    setGameIsEnding(false);
    // Deduct user UI balance
    setUser((prev) => {
      const newCosmeticBal = { ...prev };
      newCosmeticBal.balance -= betAmount;
      return newCosmeticBal;
    });
  };

  const endGame = (revealedGrid, payout) => {
    setResetCells(false);
    setLoadedGrid(revealedGrid);
    setGameInProgress(false);
    setFinalPayout(payout);
    // Payout player if applicable
    if (payout) {
      setUser((prev) => {
        const newCosmeticBal = { ...prev };

        newCosmeticBal.balance += payout;
        return newCosmeticBal;
      });
    }
  };

  const updateGame = (fields, values, multiplier, isGameOver, payout) => {
    const updatedGrid = [...loadedGrid];
    for (const field of fields) {
      updatedGrid[field] = values[field];
    }
    setLoadedGrid(updatedGrid);
    setBetMultiplier(parseFloat(multiplier));
    if (isGameOver) {
      setTimeout(() => {
        endGame(values, payout);
      }, 650);
      return;
    }
    setGemAmount((gems) => gems - fields.length);
  };

  const revealRandomCell = () => {
    // Get all unrevealed cells
    const unrevealedCells = loadedGrid
      .map((value, index) => ({ value, index }))
      .filter((item) => item.value === 0)
      .map((item) => item.index);

    if (unrevealedCells.length === 0) return;

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
    if (!isAuthenticated) {
      setGameInProgress(false);
      setIsLoadingGame(false);
      return undefined;
    }

    let cancelled = false;

    const fetchGame = async () => {
      setIsLoadingGame(true);
      try {
        const res = await fetch(apiUrl("/mines/games"), {
          credentials: "include",
        });
        if (!res.ok) {
          const errors = await res.json().catch(() => null);
          if (errors?.code === "SESSION_INVALID") {
            setUser(null);
          } else if (errors?.code !== "NOT_FOUND") {
            console.log("Errors: ", errors);
          }
          return;
        }

        const gameData = await res.json();
        if (cancelled) return;

        const { cells: grid, bet, mines, gems, multiplier } = gameData.data;
        setGameInProgress(true);
        setBetAmount(parseFloat(bet));
        setLoadedGrid(grid);
        setMinesAmount(mines);
        setGemAmount(gems);
        setBetMultiplier(parseFloat(multiplier));
        setDisableActions(false);
      } catch (error) {
        console.log("Error loading mines game:", error);
      } finally {
        if (!cancelled) setIsLoadingGame(false);
      }
    };

    fetchGame();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, setUser]);

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
          gemAmount={gemAmount}
          setMinesAmount={setMinesAmount}
          minesAmount={minesAmount}
          disableActions={disableActions}
          gameIsEnding={gameIsEnding}
          isLoadingGame={isLoadingGame}
        />
        <div className="game-screen-mines">
          <MinesGrid
            gameInProgress={gameInProgress}
            loadedGrid={loadedGrid}
            resetCells={resetCells}
            updateGame={updateGame}
            endGame={endGame}
            setDisableActions={setDisableActions}
            setGameIsEnding={setGameIsEnding}
            gameIsEnding={gameIsEnding}
          />
          <GameWinPopup payout={finalPayout} multiplier={betMultiplier} />
        </div>
      </section>
      <GameFooter />
    </main>
  );
};

export default MinesPage;
