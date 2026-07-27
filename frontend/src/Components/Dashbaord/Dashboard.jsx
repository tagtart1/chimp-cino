import React from "react";
import { Link } from "react-router-dom";
import "./Dashboard.scss";
import gem from "../../images/gem.svg";
import mine from "../../images/mine.svg";
import { PlayingCard } from "../PlayingCard/PlayingCard";

const Dashboard = () => {
  return (
    <main className="dashboard">
      <div className="dashboard-inner">
        <div className="dashboard-heading">
          <span>Chimpcino</span>
          <h1>Choose your game</h1>
        </div>

        <div className="game-card-grid">
          <Link
            className="game-card game-card-blackjack"
            to="/blackjack"
            aria-label="Play Blackjack"
          >
            <div className="game-card-visual blackjack-visual" aria-hidden="true">
              <div className="dashboard-blackjack-card dashboard-card-back">
                <PlayingCard staticCard nthCard={0} />
              </div>
              <div className="dashboard-blackjack-card dashboard-card-ace">
                <PlayingCard
                  staticCard
                  nthCard={0}
                  rank="A"
                  suit="H"
                  style={{ transform: "rotateY(180deg)" }}
                />
              </div>
            </div>
            <div className="game-card-content">
              <h2>Blackjack</h2>
              <span className="game-card-action">
                Play <span aria-hidden="true">→</span>
              </span>
            </div>
          </Link>

          <Link
            className="game-card game-card-roulette"
            to="/roulette"
            aria-label="Play Roulette"
          >
            <div className="game-card-visual roulette-visual" aria-hidden="true">
              <div className="roulette-wheel">
                <span className="roulette-ball" />
              </div>
            </div>
            <div className="game-card-content">
              <h2>Roulette</h2>
              <span className="game-card-action">
                Play <span aria-hidden="true">→</span>
              </span>
            </div>
          </Link>

          <Link
            className="game-card game-card-mines"
            to="/mines"
            aria-label="Play Mines"
          >
            <div className="game-card-visual mines-visual" aria-hidden="true">
              <img className="mines-gem mines-gem-left" src={gem} alt="" />
              <img className="mines-bomb" src={mine} alt="" />
              <img className="mines-gem mines-gem-right" src={gem} alt="" />
            </div>
            <div className="game-card-content">
              <h2>Mines</h2>
              <span className="game-card-action">
                Play <span aria-hidden="true">→</span>
              </span>
            </div>
          </Link>
        </div>
      </div>
    </main>
  );
};

export default Dashboard;
