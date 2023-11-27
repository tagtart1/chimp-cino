import React, { useEffect, useState } from "react";
import "./PlayingCard.scss";
import { motion, useAnimation } from "framer-motion";

export const PlayingCard = ({
  style,
  value,
  staticCard,
  dealerCard,
  nthCard,
}) => {
  const controls = useAnimation();
  const startOffsetX = nthCard * -33;

  const playerCardVariants = {
    initial: {
      transform: `translate(${startOffsetX + 375}%, -${320}%)`,
    },
    toPosition: {
      transform: "translate(0, 0)",
      transition: { duration: 0.5 },
    },
    rotate: {
      transform: "rotateY(180deg)",
      transition: { duration: 0.5 },
    },
  };

  const dealerCardVariants = {
    initial: { transform: `translate(${startOffsetX + 375}%, -100%)` },
    toPosition: {
      transform: "translate(0, 0)",
      transition: { duration: 0.5 },
    },
    rotate: {
      transform: "rotateY(180deg)",
      transition: { duration: 0.5 },
    },
  };

  useEffect(() => {
    const sequence = async () => {
      await controls.start("toPosition");
      await controls.start("rotate");
    };

    sequence();
  }, [controls]);

  return (
    <motion.div
      className="playing-card"
      style={style}
      variants={
        !staticCard
          ? dealerCard
            ? dealerCardVariants
            : playerCardVariants
          : ""
      }
      initial="initial"
      animate={controls}
    >
      <div className="front">
        <div className="content">
          <div>{value}</div>
          <HeartIcon />
        </div>
      </div>
      <div className="back"></div>
    </motion.div>
  );
};

const HeartIcon = () => {
  return (
    <svg fill="currentColor" viewBox="0 0 64 64" class="svg-icon">
      <path d="M30.907 55.396.457 24.946v.002A1.554 1.554 0 0 1 0 23.843c0-.432.174-.82.458-1.104l14.13-14.13a1.554 1.554 0 0 1 1.104-.458c.432 0 .821.175 1.104.458l14.111 14.13c.272.272.645.443 1.058.453l.1-.013h.004a1.551 1.551 0 0 0 1.045-.452l14.09-14.09a1.554 1.554 0 0 1 1.104-.457c.432 0 .82.174 1.104.457l14.13 14.121a1.557 1.557 0 0 1 0 2.209L33.114 55.396v-.002c-.27.268-.637.438-1.046.452v.001h.003a.712.712 0 0 1-.04.002h-.029c-.427 0-.815-.173-1.095-.453Z"></path>
    </svg>
  );
};
