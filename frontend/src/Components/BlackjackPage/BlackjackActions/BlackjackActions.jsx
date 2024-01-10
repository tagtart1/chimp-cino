import React from "react";
import "./BlackjackActions.scss";

const BlackjackActions = ({ handleAction, handleSplit }) => {
  const hitEndpoint = "http://localhost:5000/api/v1/blackjack/games/hit";
  const standEndpoint = "http://localhost:5000/api/v1/blackjack/games/stand";
  const doubleEndpoint = "http://localhost:5000/api/v1/blackjack/games/double";
  const splitEndpoint = "http://localhost:5000/api/v1/blackjack/games/split";

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

    // Turn all valued 1 aces back to 11 as this will be displayed dynamically in the animation
    if (actionResults.data.dealer) {
      actionResults.data.dealer.cards.forEach((element) => {
        if (element.value === 1) {
          element.value = 11;
        }
      });
    }

    actionResults.data.player.cards.forEach((card) => {
      if (card.value === 1) {
        card.value = 11;
      }
    });

    handleAction(actionResults.data, true);
  };

  const standHand = async () => {
    const response = await fetch(standEndpoint, {
      credentials: "include",
      method: "PATCH",
    });

    if (!response.ok) {
      const errors = await response.json();
      console.log("error", errors);
      return;
    }

    const actionResults = await response.json();

    actionResults.data.dealer.cards.forEach((element) => {
      if (element.value === 1) {
        element.value = 11;
      }
    });

    handleAction(actionResults.data, false);
  };

  const doubleDown = async () => {
    const response = await fetch(doubleEndpoint, {
      credentials: "include",
      method: "PATCH",
    });

    if (!response.ok) {
      const errors = await response.json();
      console.log("error", errors);
      return;
    }

    const actionResults = await response.json();
    console.log("DOUBLE results", actionResults);
    actionResults.data.player.cards.forEach((card) => {
      if (card.value === 1) {
        card.value = 11;
      }
    });

    if (actionResults.data.dealer) {
      actionResults.data.dealer.cards.forEach((element) => {
        if (element.value === 1) {
          element.value = 11;
        }
      });
    }

    handleAction(actionResults.data, true, true);
  };

  const splitHand = async () => {
    const response = await fetch(splitEndpoint, {
      credentials: "include",
      method: "PATCH",
    });

    if (!response.ok) {
      const errors = await response.json();
      console.log("error", errors);
      return;
    }

    const actionResults = await response.json();

    handleSplit(actionResults.data);

    console.log("SPLIT results", actionResults);
  };

  return (
    <div className="blackjack-actions">
      <button onClick={hitNewCard}>Hit</button>
      <button onClick={standHand}>Stand</button>
      <button onClick={splitHand}>Split</button>
      <button onClick={doubleDown}>Double</button>
    </div>
  );
};

export default BlackjackActions;
