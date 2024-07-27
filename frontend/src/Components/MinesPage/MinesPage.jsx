import React from "react";
import "./MinesPage.scss";
import MinesGrid from "./MinesGrid/MinesGrid";
import MinesBetControls from "./MinesBetControls/MinesBetControls";

const MinesPage = () => {
  return (
    <main className="mines-main">
      <section className="mines-section">
        <MinesBetControls />
        <div className="game-screen-mines">
          <MinesGrid />
        </div>
      </section>
    </main>
  );
};

export default MinesPage;
