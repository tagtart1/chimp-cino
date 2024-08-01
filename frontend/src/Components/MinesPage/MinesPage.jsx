import React, { useState } from "react";
import "./MinesPage.scss";
import MinesGrid from "./MinesGrid/MinesGrid";
import MinesBetControls from "./MinesBetControls/MinesBetControls";

const MinesPage = () => {
  const [gameInProgress, setGameInProgress] = useState(false);

  return (
    <main className="mines-main">
      <section className="mines-section">
        <MinesBetControls
          gameInProgress={gameInProgress}
          setGameInProgress={setGameInProgress}
        />
        <div className="game-screen-mines">
          <MinesGrid gameInProgress={gameInProgress} />
        </div>
      </section>
    </main>
  );
};

export default MinesPage;
