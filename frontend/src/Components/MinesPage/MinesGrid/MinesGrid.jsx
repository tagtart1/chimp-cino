import React from "react";
import "./MinesGrid.scss";

const MinesGrid = () => {
  const revealCell = (e) => {
    const cell = e.target;
    cell.className.add("test");
  };

  return (
    <div className="mines-grid">
      <div className="mine-cell"></div>
      <div className="mine-cell"></div>
      <div className="mine-cell"></div>
      <div className="mine-cell"></div>
      <div className="mine-cell"></div>
      <div className="mine-cell"></div>
      <div className="mine-cell"></div>
      <div className="mine-cell"></div>
      <div className="mine-cell"></div>
      <div className="mine-cell"></div>
      <div className="mine-cell"></div>
      <div className="mine-cell"></div>
      <div className="mine-cell"></div>
      <div className="mine-cell" onClick={revealCell}></div>
      <div className="mine-cell"></div>
      <div className="mine-cell"></div>
      <div className="mine-cell"></div>
      <div className="mine-cell"></div>
      <div className="mine-cell"></div>
      <div className="mine-cell"></div>
      <div className="mine-cell"></div>
      <div className="mine-cell"></div>
      <div className="mine-cell"></div>
      <div className="mine-cell"></div>
      <div className="mine-cell"></div>
    </div>
  );
};

export default MinesGrid;
