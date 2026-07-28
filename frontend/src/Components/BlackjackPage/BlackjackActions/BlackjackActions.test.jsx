import { act } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import BlackjackActions from "./BlackjackActions";

const baseProps = {
  handleAction: jest.fn(),
  handleSplit: jest.fn(),
  manageInsurance: jest.fn(),
  offerInsurance: false,
  canHit: false,
  canStand: false,
  canSplit: false,
  canDouble: false,
  canInsurance: false,
  setActionPending: jest.fn(),
  handleAuthError: jest.fn(),
};

describe("BlackjackActions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("uses native disabled state for unavailable actions", () => {
    render(<BlackjackActions {...baseProps} />);

    expect(screen.getByRole("button", { name: "Hit" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Stand" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Split" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Double" })).toBeDisabled();
  });

  it("deduplicates clicks and remains pending through the action animation", async () => {
    let finishAnimation;
    const animation = new Promise((resolve) => {
      finishAnimation = resolve;
    });
    const handleAction = jest.fn(() => animation);
    global.fetch = jest.fn(async () => ({
      ok: true,
      json: async () => ({
        data: {
          player: { cards: [{ rank: "2", value: 2 }] },
        },
      }),
    }));

    render(
      <BlackjackActions
        {...baseProps}
        canHit
        handleAction={handleAction}
      />
    );

    const hit = screen.getByRole("button", { name: "Hit" });
    fireEvent.click(hit);
    fireEvent.click(hit);

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
    expect(baseProps.setActionPending).toHaveBeenCalledWith(true);
    expect(baseProps.setActionPending).not.toHaveBeenCalledWith(false);

    await act(async () => {
      finishAnimation();
      await animation;
    });
    await waitFor(() =>
      expect(baseProps.setActionPending).toHaveBeenCalledWith(false)
    );
  });

  it("opens auth handling when the server reports an expired session", async () => {
    const error = { code: "SESSION_INVALID" };
    global.fetch = jest.fn(async () => ({
      ok: false,
      json: async () => error,
    }));

    render(<BlackjackActions {...baseProps} canStand />);
    fireEvent.click(screen.getByRole("button", { name: "Stand" }));

    await waitFor(() =>
      expect(baseProps.handleAuthError).toHaveBeenCalledWith(error)
    );
  });
});
