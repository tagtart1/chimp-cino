import React, { useRef, useState } from "react";
import "./MinesBetControls.scss";
import MinesBetInput from "./MinesBetInput";
import MinesAmountInput from "./MinesAmountInput";
import TotalGainOutput from "./TotalGainOutput";
import { apiUrl } from "../../../config/api";
import useGameAuth from "../../../Hooks/useGameAuth";

const MinesBetControls = ({
  betAmount,
  setBetAmount,
  gameInProgress,
  startGame,
  endGame,
  revealRandomCell,
  betMultiplier,
  setMinesAmount,
  minesAmount,
  gemAmount,
  disableActions,
  gameIsEnding,
  isLoadingGame,
}) => {
  const { user, requireAuth, handleAuthError } = useGameAuth();
  const [isStarting, setIsStarting] = useState(false);
  const [isCashingOut, setIsCashingOut] = useState(false);
  const startRequestRef = useRef(false);
  const cashoutRequestRef = useRef(false);

  const playGame = async () => {
    if (!requireAuth()) return;
    if (
      startRequestRef.current ||
      isLoadingGame ||
      parseFloat(betAmount) <= 0 ||
      gameInProgress
    )
      return;

    startRequestRef.current = true;
    setIsStarting(true);
    try {
      const resolution = await fetch(apiUrl("/mines/games"), {
        credentials: "include",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mines: parseInt(minesAmount),
          bet: parseFloat(betAmount),
        }),
      });

      if (!resolution.ok) {
        const errors = await resolution.json().catch(() => null);
        handleAuthError(errors);
        console.log("Error:", errors);
        return;
      }

      const gems = 25 - minesAmount;
      startGame(gems);
    } catch (error) {
      console.log(error);
    } finally {
      startRequestRef.current = false;
      setIsStarting(false);
    }
  };

  // Retrive the completed grid, reveals the grid
  const cashout = async () => {
    if (!requireAuth()) return;
    if (cashoutRequestRef.current || disableActions || gameIsEnding) return;

    cashoutRequestRef.current = true;
    setIsCashingOut(true);
    try {
      const res = await fetch(apiUrl("/mines/cashout"), {
        credentials: "include",
        method: "POST",
      });
      if (!res.ok) {
        const errors = await res.json().catch(() => null);
        handleAuthError(errors);
        console.log("Error cashing out:", errors);
        return;
      }
      const gameData = (await res.json()).data;

      endGame(gameData.cells, gameData.payout);
    } catch (error) {
      console.log("Cashout catch block", error);
    } finally {
      cashoutRequestRef.current = false;
      setIsCashingOut(false);
    }
  };

  const hasRevealedGem =
    parseInt(minesAmount, 10) + parseInt(gemAmount, 10) < 25;
  const actionsDisabled = disableActions || gameIsEnding || isCashingOut;
  const playDisabled =
    isLoadingGame ||
    isStarting ||
    gameInProgress ||
    (Boolean(user) && parseFloat(betAmount) <= 0);

  return (
    <section className="mines-bet-controls">
      {!gameInProgress ? (
        <>
          <MinesBetInput
            setBetAmount={setBetAmount}
            betAmount={betAmount}
            gameInProgress={gameInProgress}
            disabled={isLoadingGame || isStarting}
          />
          <MinesAmountInput
            setMinesAmount={setMinesAmount}
            minesAmount={minesAmount}
            gameInProgress={gameInProgress}
            gemAmount={gemAmount}
            disabled={isLoadingGame || isStarting}
          />
          <button
            className="play-mines-button"
            onClick={playGame}
            disabled={playDisabled}
          >
            {isLoadingGame ? "Loading…" : isStarting ? "Starting…" : "Play"}
          </button>
        </>
      ) : (
        <>
          <MinesBetInput
            betAmount={betAmount}
            gameInProgress={gameInProgress}
          />
          <MinesAmountInput
            minesAmount={minesAmount}
            gameInProgress={gameInProgress}
            gemAmount={gemAmount}
          />
          <TotalGainOutput
            totalGain={Math.max(
              betAmount * betMultiplier - betAmount,
              0
            ).toFixed(2)}
            multiplier={betMultiplier}
          />
          <button
            className="random-tile-button"
            onClick={revealRandomCell}
            disabled={actionsDisabled}
          >
            Pick random tile
          </button>
          <button
            className="play-mines-button"
            onClick={cashout}
            disabled={actionsDisabled || !hasRevealedGem}
          >
            {actionsDisabled ? (
              <svg
                fill="currentColor"
                viewBox="0 0 96 96"
                className="jiggle mini-bomb"
              >
                <path d="M85.405 6.399a14.328 14.328 0 0 1 10.015 4.559h-.003a2.114 2.114 0 0 1-.078 3c-.37.368-.876.599-1.44.599h-.024a2.081 2.081 0 0 1-1.539-.68l-.006-.007a9.964 9.964 0 0 0-7.324-3.194 9.93 9.93 0 0 0-5.945 1.961c3.162 4.2 4.4 9.44.921 12.718l-2.36 2.078-.111-.192c-4.301-6.877-10.38-12.534-17.843-16.442l3.44-3.278c3.518-3.32 8.877-1.6 12.875 1.918a14.132 14.132 0 0 1 9.398-3.04h.024Zm-46.414 83.86c21.535 0 38.991-17.456 38.991-38.99 0-21.536-17.456-38.992-38.991-38.992S0 29.733 0 51.268 17.456 90.26 38.991 90.26Z"></path>
              </svg>
            ) : (
              <div>Cashout</div>
            )}
          </button>
        </>
      )}
    </section>
  );
};

export default MinesBetControls;
