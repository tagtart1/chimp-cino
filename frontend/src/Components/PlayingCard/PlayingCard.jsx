import React, { useEffect, useState, useRef } from "react";
import "./PlayingCard.scss";
import { motion, useAnimation } from "framer-motion";

export const PlayingCard = ({
  style,

  staticCard,
  dealerCard,
  nthCard,
  rank,
  suit,
  gameResults,
  isBlank,
  startExit,
  splitCard,
  selected,
}) => {
  const controls = useAnimation();
  const card = useRef();

  // The first card's container is usually off on the start so we account for it with the offset
  // nthcard of 0 receives a greater buffer
  const startOffsetX = nthCard === 0 ? -25 : nthCard * -33;
  const startOffsetY = nthCard === 0 ? 100 : 0;

  const initialState = splitCard
    ? {
        transform: "translateX(-195%) rotateY(180deg)",
        opacity: 1,
      }
    : {};

  const playerCardVariants = !staticCard
    ? {
        initial: {
          transform: `translate(${startOffsetX + 375}%, -${
            320 + startOffsetY
          }%)`,
          opacity: 1,
        },

        toPosition: {
          transform: "translate(0, 0)",
          transition: { duration: 0.5 },
        },
        rotate: {
          transform: "rotateY(180deg) ",

          transition: { duration: 0.5 },
        },

        leave: {
          transform: "translate(-10px, 10px) rotateY(180deg)",
          opacity: 0,
          transition: { duration: 0.2, delay: 0.15 * nthCard },
        },
      }
    : {
        initial: initialState,
        toPosition: {
          transform: "translate(0, 0) rotateY(180deg)",
          transition: { duration: 0.5 },
        },
        leave: {
          transform: "translate(-10px, 10px) rotateY(180deg) ",
          opacity: 0,
          transition: { duration: 0.2, delay: 0.15 * nthCard },
        },
      };

  const dealerCardVariants = !staticCard
    ? {
        initial: { transform: `translate(${startOffsetX + 375}%, -100%)` },
        toPosition: {
          transform: "translate(0, 0)",
          transition: { duration: 0.5 },
        },
        rotate: {
          transform: "rotateY(180deg)",
          transition: { duration: 0.5 },
        },
        leave: {
          transform: !isBlank
            ? "translate(-10px, 10px) rotateY(180deg)"
            : "translate(-10px, 10px)",
          opacity: 0,
          transition: { duration: 0.2, delay: 0.15 * nthCard },
        },
      }
    : {
        leave: {
          transform: !isBlank
            ? "translate(-10px, 10px) rotateY(180deg)"
            : "translate(-10px, 10px)",
          opacity: 0,
          transition: { duration: 0.2, delay: 0.15 * nthCard },
        },
      };

  useEffect(() => {
    const moveSplitCard = async () => {
      console.log("moving split card");
      await controls.start("toPosition");
    };

    const sequence = async () => {
      if (!startExit) {
        await controls.start("toPosition");
        if (isBlank) return;
        await controls.start("rotate");
      } else {
        if (!isBlank)
          card.current.removeChild(card.current.querySelector(".back"));
        await controls.start("leave");
      }
    };
    if (splitCard) {
      moveSplitCard();
    }
    if (staticCard && !startExit) return;
    sequence();
    // Log
  }, [controls, staticCard, isBlank, startExit, splitCard]);

  const gameResultsStyle =
    gameResults === "player"
      ? "won"
      : gameResults === "dealer"
      ? "lost"
      : gameResults === "push"
      ? "push"
      : "";

  const isSplitAndSelected = selected ? "selected-hand" : "";

  return (
    <motion.div
      className={
        !dealerCard
          ? `playing-card ${gameResultsStyle} ${isSplitAndSelected} `
          : "playing-card"
      }
      style={style}
      variants={dealerCard ? dealerCardVariants : playerCardVariants}
      initial={"initial"}
      animate={controls}
      ref={card}
    >
      <div className="front">
        {!isBlank ? (
          <div className="content">
            <div
              className={
                suit === "C" || suit === "S" ? "black-text" : "red-text"
              }
            >
              {rank}
            </div>
            {suit === "C" ? (
              <ClubIcon />
            ) : suit === "H" ? (
              <HeartIcon />
            ) : suit === "S" ? (
              <SpadeIcon />
            ) : suit === "D" ? (
              <DiamondIcon />
            ) : null}
          </div>
        ) : null}
      </div>
      <div className="back"></div>
    </motion.div>
  );
};

const CardSuit = ({ symbol }) => {
  switch (symbol) {
    case "H": {
      console.log("hey");
      return <HeartIcon />;
    }
    case "D":
      return <DiamondIcon />;
    case "S":
      return <SpadeIcon />;
    case "C":
      return <ClubIcon />;
    case undefined:
      return <div>hey</div>;

    default:
      return <div>hey</div>;
  }
};

const HeartIcon = () => {
  return (
    <svg fill="#E9113C" viewBox="0 0 64 64">
      <path d="M30.907 55.396.457 24.946v.002A1.554 1.554 0 0 1 0 23.843c0-.432.174-.82.458-1.104l14.13-14.13a1.554 1.554 0 0 1 1.104-.458c.432 0 .821.175 1.104.458l14.111 14.13c.272.272.645.443 1.058.453l.1-.013h.004a1.551 1.551 0 0 0 1.045-.452l14.09-14.09a1.554 1.554 0 0 1 1.104-.457c.432 0 .82.174 1.104.457l14.13 14.121a1.557 1.557 0 0 1 0 2.209L33.114 55.396v-.002c-.27.268-.637.438-1.046.452v.001h.003a.712.712 0 0 1-.04.002h-.029c-.427 0-.815-.173-1.095-.453Z"></path>
    </svg>
  );
};

const DiamondIcon = () => {
  return (
    <svg fill="#E9113C" viewBox="0 0 64 64">
      <path d="m37.036 2.1 24.875 24.865a7.098 7.098 0 0 1 2.09 5.04 7.1 7.1 0 0 1-2.09 5.04L37.034 61.91a7.076 7.076 0 0 1-5.018 2.077c-.086 0-.174 0-.25-.004v.004h-.01a7.067 7.067 0 0 1-4.79-2.071L2.089 37.049A7.098 7.098 0 0 1 0 32.009c0-1.97.798-3.75 2.09-5.04L26.965 2.102v.002A7.07 7.07 0 0 1 31.754.021l.002-.004h-.012c.088-.002.176-.004.264-.004A7.08 7.08 0 0 1 37.036 2.1Z"></path>
    </svg>
  );
};

const SpadeIcon = () => {
  return (
    <svg fill="#1A2C38" viewBox="0 0 64 64">
      <path d="M63.256 30.626 33.082.452a1.526 1.526 0 0 0-1.16-.45h.003v.002a1.53 1.53 0 0 0-1.033.45V.452L.74 30.604a1.54 1.54 0 0 0-.45 1.09c0 .426.172.81.45 1.09l14.002 14.002c.28.278.664.45 1.09.45.426 0 .81-.172 1.09-.45l13.97-13.97a1.53 1.53 0 0 1 1.032-.45h.002a.53.53 0 0 0 .058-.002c.424 0 .81.172 1.088.452l14.002 14.002c.28.278.664.45 1.09.45.426 0 .81-.172 1.09-.45l14.002-14.002c.282-.28.453-.668.453-1.096 0-.428-.173-.816-.453-1.096v.002ZM45.663 64H18.185a.982.982 0 0 1-.692-1.678l13.736-13.736h-.002a.986.986 0 0 1 .694-.286h.002v.048l.01-.048c.268.002.51.11.686.286l13.736 13.736A.982.982 0 0 1 45.663 64Z"></path>
    </svg>
  );
};

const ClubIcon = () => {
  return (
    <svg fill="#1A2C38" viewBox="0 0 64 64">
      <path d="M14.022 50.698.398 36.438A1.47 1.47 0 0 1 0 35.427c0-.395.152-.751.398-1.012l13.624-14.268c.249-.257.59-.417.967-.417.378 0 .718.16.967.417l13.625 14.268c.245.26.397.617.397 1.012 0 .396-.152.752-.397 1.013L15.957 50.698c-.25.257-.59.416-.968.416s-.718-.16-.967-.416Zm34.022 0L34.41 36.438a1.471 1.471 0 0 1-.398-1.012c0-.395.152-.751.398-1.012l13.633-14.268c.248-.257.589-.417.967-.417s.718.16.967.417l13.624 14.268c.246.26.398.617.398 1.012 0 .396-.152.752-.398 1.013L49.978 50.698c-.249.257-.59.416-.967.416-.378 0-.719-.16-.968-.416ZM44.541 62h.01c.685 0 1.239-.58 1.239-1.296 0-.36-.14-.686-.367-.92L32.871 46.657a1.206 1.206 0 0 0-.871-.375h-.04L27.335 62h17.207ZM32.963 32.965l13.624-14.25a1.47 1.47 0 0 0 .398-1.012 1.47 1.47 0 0 0-.398-1.013L32.963 2.422a1.334 1.334 0 0 0-.97-.422h-.03L26.51 16.229l5.455 17.156h.03c.38 0 .72-.16.968-.42Z"></path>
      <path d="M31.028 2.424 17.404 16.683c-.245.26-.397.616-.397 1.012s.152.752.397 1.012l13.624 14.26c.24.253.568.412.934.421L31.963 2a1.33 1.33 0 0 0-.935.424Zm-12.45 57.36c-.228.234-.368.56-.368.92 0 .717.554 1.296 1.238 1.296h12.515l-.002-15.718c-.33.008-.625.15-.841.375L18.576 59.784Z"></path>
    </svg>
  );
};
