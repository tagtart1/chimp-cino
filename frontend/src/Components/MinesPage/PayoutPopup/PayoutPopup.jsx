import React from "react";
import "./PayoutPopup.scss";
import { motion, AnimatePresence } from "framer-motion";

const PayoutPopup = ({ payout, multiplier }) => {
  return (
    <AnimatePresence>
      {payout && (
        <motion.div
          initial={{ scale: 0.3 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 20,
          }}
          className="payout-popup-wrapper"
        >
          <div className="multiplier">
            {multiplier.toFixed(2)}
            <div>×</div>
          </div>
          <div className="divider"></div>
          <div className="payout">
            {payout.toFixed(2)}
            <span>
              <CoinSVG />
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const CoinSVG = () => {
  return (
    <div className="coin-input-img">
      <svg fill="none" viewBox="0 0 96 96">
        <path
          d="M48 96c26.51 0 48-21.49 48-48S74.51 0 48 0 0 21.49 0 48s21.49 48 48 48Z"
          fill="#FFC800"
        ></path>
        <path
          d="M48.16 21.92c10.16 0 16.56 4.92 20.32 10.72l-8.68 4.72c-2.28-3.44-6.48-6.16-11.64-6.16-8.88 0-15.36 6.84-15.36 16.12 0 9.28 6.48 16.12 15.36 16.12 4.48 0 8.44-1.84 10.6-3.76v-5.96H45.68v-8.96h23.4v18.76c-5 5.6-12 9.28-20.88 9.28-14.32 0-26.12-10-26.12-25.44C22.08 31.92 33.84 22 48.2 22l-.04-.08Z"
          fill="#473800"
        ></path>
      </svg>
    </div>
  );
};

export default PayoutPopup;
