import React from "react";
import "./GameFooter.scss";
import VolumeInput from "./VolumeInput/VolumeInput";

const GameFooter = () => {
  return (
    <div className="game-footer-wrapper">
      <VolumeInput />
    </div>
  );
};

export default GameFooter;
