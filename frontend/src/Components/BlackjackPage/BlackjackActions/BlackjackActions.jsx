import React, { useRef } from "react";
import "./BlackjackActions.scss";
import { apiUrl } from "../../../config/api";

const BlackjackActions = ({
  handleAction,
  handleSplit,
  manageInsurance,
  offerInsurance,
  canHit,
  canStand,
  canSplit,
  canDouble,
  canInsurance,
  setActionPending,
  handleAuthError,
}) => {
  const requestPendingRef = useRef(false);

  const runAction = async ({
    allowed,
    path,
    options = {},
    onSuccess,
  }) => {
    if (!allowed || requestPendingRef.current) return;

    requestPendingRef.current = true;
    setActionPending(true);

    try {
      const response = await fetch(apiUrl(path), {
        credentials: "include",
        method: "PATCH",
        ...options,
      });
      const actionResults = await response.json().catch(() => null);

      if (!response.ok) {
        handleAuthError(actionResults);
        console.log("Error", actionResults);
        return;
      }

      await onSuccess(actionResults.data);
    } catch (error) {
      console.log("Blackjack action failed", error);
    } finally {
      requestPendingRef.current = false;
      setActionPending(false);
    }
  };

  const normalizeAces = (cards = []) => {
    cards.forEach((card) => {
      if (card.value === 1) card.value = 11;
    });
  };

  const hitNewCard = () =>
    runAction({
      allowed: canHit,
      path: "/blackjack/games/hit",
      onSuccess: async (results) => {
        normalizeAces(results.dealer?.cards);
        normalizeAces(results.player.cards);
        await handleAction(results, true);
      },
    });

  const standHand = () =>
    runAction({
      allowed: canStand,
      path: "/blackjack/games/stand",
      onSuccess: async (results) => {
        normalizeAces(results.dealer?.cards);
        await handleAction(results, false);
      },
    });

  const doubleDown = () =>
    runAction({
      allowed: canDouble,
      path: "/blackjack/games/double",
      onSuccess: async (results) => {
        normalizeAces(results.player.cards);
        normalizeAces(results.dealer?.cards);
        await handleAction(results, true, true);
      },
    });

  const splitHand = () =>
    runAction({
      allowed: canSplit,
      path: "/blackjack/games/split",
      onSuccess: handleSplit,
    });

  const handleInsurance = (acceptInsurance) =>
    runAction({
      allowed: canInsurance,
      path: "/blackjack/games/insurance",
      options: {
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          acceptInsurance,
        }),
      },
      onSuccess: (results) => manageInsurance(results, acceptInsurance),
    });

  return !offerInsurance ? (
    <div className="blackjack-actions">
      <button onClick={hitNewCard} disabled={!canHit}>
        Hit
      </button>
      <button onClick={standHand} disabled={!canStand}>
        Stand
      </button>
      <button onClick={splitHand} disabled={!canSplit}>
        Split
      </button>
      <button onClick={doubleDown} disabled={!canDouble}>
        Double
      </button>
    </div>
  ) : (
    <div className="blackjack-insurance-offer">
      <h2>Insurance?</h2>

      <button
        onClick={() => handleInsurance(true)}
        disabled={!canInsurance}
      >
        Accept insurance
      </button>
      <button
        onClick={() => handleInsurance(false)}
        disabled={!canInsurance}
      >
        No insurance
      </button>
    </div>
  );
};

export default BlackjackActions;
