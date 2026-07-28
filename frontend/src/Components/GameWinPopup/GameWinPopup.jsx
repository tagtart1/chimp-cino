import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import soundManager from "../../Helpers/sfxPlayer";
import "./GameWinPopup.scss";

const formatWinValue = (value) =>
  Number(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const CoinIcon = () => (
  <svg
    className="game-win-coin"
    fill="none"
    viewBox="0 0 96 96"
    aria-hidden="true"
  >
    <path
      d="M48 96c26.51 0 48-21.49 48-48S74.51 0 48 0 0 21.49 0 48s21.49 48 48 48Z"
      fill="#FFC800"
    />
    <path
      d="M48.16 21.92c10.16 0 16.56 4.92 20.32 10.72l-8.68 4.72c-2.28-3.44-6.48-6.16-11.64-6.16-8.88 0-15.36 6.84-15.36 16.12 0 9.28 6.48 16.12 15.36 16.12 4.48 0 8.44-1.84 10.6-3.76v-5.96H45.68v-8.96h23.4v18.76c-5 5.6-12 9.28-20.88 9.28-14.32 0-26.12-10-26.12-25.44C22.08 31.92 33.84 22 48.2 22l-.04-.08Z"
      fill="#473800"
    />
  </svg>
);

const GameWinPopup = ({ payout = 0, multiplier = 0 }) => {
  const hasWin = Number(payout) > 0 && Number(multiplier) > 1;

  useEffect(() => {
    if (hasWin) soundManager.playAudio("cashout");
  }, [hasWin, payout]);

  return (
    <AnimatePresence>
      {hasWin ? (
        <motion.div
          className="game-win-popup-layer"
          role="status"
          aria-live="polite"
        >
          <motion.div
            className="game-win-popup"
            initial={{ scale: 0.3 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <div className="game-win-multiplier">
              {Number(multiplier).toFixed(2)}
              <span>×</span>
            </div>
            <span className="game-win-divider" aria-hidden="true" />
            <div className="game-win-payout">
              {formatWinValue(payout)}
              <CoinIcon />
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};

export default GameWinPopup;
