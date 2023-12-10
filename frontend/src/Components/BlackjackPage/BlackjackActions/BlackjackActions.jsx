import React from "react";
import "./BlackjackActions.scss";

const BlackjackActions = ({ dealNewCard }) => {
  const hitEndpoint = "http://localhost:5000/api/v1/blackjack/games/hit";

  const hitNewCard = async () => {
    const response = await fetch(hitEndpoint, {
      credentials: "include",
      method: "PATCH",
    });

    if (!response.ok) {
      const errors = await response.json();
      console.log("Error", errors);
      return;
    }

    const actionResults = await response.json();
    console.log(actionResults.data);
    dealNewCard(
      actionResults.data.player,
      true,
      actionResults.data.is_game_over
    );
  };
  return (
    <div className="blackjack-actions">
      <button onClick={hitNewCard}>Hit</button>
      <button>Stand</button>
      <button>Split</button>
      <button>Double</button>
    </div>
  );
};

export default BlackjackActions;
