import React from "react";
import "./BlackjackActions.scss";

const BlackjackActions = () => {
  return (
    <div className="blackjack-actions">
      <button disabled>Hit</button>
      <button>Stand</button>
      <button>Split</button>
      <button>Double</button>
    </div>
  );
};

export default BlackjackActions;
