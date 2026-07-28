import { act } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import MinesBetControls from "./MinesBetControls";

let mockGameAuth;

jest.mock("../../../Hooks/useGameAuth", () => () => mockGameAuth);
jest.mock("./MinesBetInput", () => ({ disabled }) => (
  <input aria-label="Bet amount" disabled={disabled} />
));
jest.mock("./MinesAmountInput", () => ({ disabled }) => (
  <select aria-label="Mines" disabled={disabled} />
));
jest.mock("./TotalGainOutput", () => () => <div>Total gain</div>);

const defaultProps = {
  betAmount: 0,
  setBetAmount: jest.fn(),
  gameInProgress: false,
  startGame: jest.fn(),
  endGame: jest.fn(),
  revealRandomCell: jest.fn(),
  betMultiplier: 1,
  setMinesAmount: jest.fn(),
  minesAmount: 3,
  gemAmount: 0,
  disableActions: false,
  gameIsEnding: false,
  isLoadingGame: false,
};

describe("MinesBetControls", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
    mockGameAuth = {
      user: null,
      requireAuth: jest.fn(() => false),
      handleAuthError: jest.fn(),
    };
  });

  it("keeps Play available to open login for an unauthenticated user", () => {
    render(<MinesBetControls {...defaultProps} />);

    const play = screen.getByRole("button", { name: "Play" });
    expect(play).toBeEnabled();

    fireEvent.click(play);
    expect(mockGameAuth.requireAuth).toHaveBeenCalledTimes(1);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("disables Play while the active-game lookup is loading", () => {
    render(<MinesBetControls {...defaultProps} isLoadingGame />);

    expect(screen.getByRole("button", { name: "Loading…" })).toBeDisabled();
    expect(screen.getByLabelText("Bet amount")).toBeDisabled();
    expect(screen.getByLabelText("Mines")).toBeDisabled();
  });

  it("deduplicates start requests and locks Play until the request finishes", async () => {
    let finishRequest;
    const request = new Promise((resolve) => {
      finishRequest = resolve;
    });
    global.fetch = jest.fn(() => request);
    mockGameAuth = {
      user: { balance: 100 },
      requireAuth: jest.fn(() => true),
      handleAuthError: jest.fn(),
    };

    render(<MinesBetControls {...defaultProps} betAmount={10} />);

    const play = screen.getByRole("button", { name: "Play" });
    fireEvent.click(play);
    fireEvent.click(play);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Starting…" })).toBeDisabled();

    await act(async () => {
      finishRequest({ ok: true });
      await request;
    });
    await waitFor(() =>
      expect(defaultProps.startGame).toHaveBeenCalledWith(22)
    );
  });

  it("uses native disabled state during a reveal and before cashout is valid", () => {
    mockGameAuth = {
      user: { balance: 100 },
      requireAuth: jest.fn(() => true),
      handleAuthError: jest.fn(),
    };
    const { rerender } = render(
      <MinesBetControls {...defaultProps} gameInProgress gemAmount={22} />
    );

    expect(
      screen.getByRole("button", { name: "Pick random tile" })
    ).toBeEnabled();
    expect(screen.getByRole("button", { name: "Cashout" })).toBeDisabled();

    rerender(
      <MinesBetControls
        {...defaultProps}
        gameInProgress
        gemAmount={21}
        disableActions
      />
    );

    expect(
      screen.getByRole("button", { name: "Pick random tile" })
    ).toBeDisabled();
  });
});
