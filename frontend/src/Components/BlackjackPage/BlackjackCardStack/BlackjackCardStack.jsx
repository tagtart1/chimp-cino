import React from "react";
import { PlayingCard } from "../../PlayingCard/PlayingCard";
import "./BlackjackCardStack.scss";

const BlackjackCardStack = ({ theRef }) => {
  return (
    <div className="static-stack" ref={theRef}>
      <PlayingCard
        staticCard={true}
        style={{
          transform: `translate(0, 10%)`,
        }}
      />
      <PlayingCard
        staticCard={true}
        style={{
          transform: `translate(0, 8%)`,
        }}
      />
      <PlayingCard
        staticCard={true}
        style={{
          transform: `translate(0, 6%)`,
        }}
      />
      <PlayingCard
        staticCard={true}
        style={{
          transform: `translate(0, 4%)`,
        }}
      />
      <PlayingCard
        staticCard={true}
        style={{
          transform: `translate(0, 2%)`,
        }}
      />
    </div>
  );
};

export default BlackjackCardStack;
