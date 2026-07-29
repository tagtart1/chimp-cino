import { act, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import WalletBalance from "./WalletBalance";

let mockUser;

jest.mock("../../Contexts/UserProvider", () => ({
  useUser: () => ({ user: mockUser }),
}));

jest.mock("../DailyBonusModal/DailyBonusModal", () => ({ isOpen }) =>
  isOpen ? <div role="dialog">Daily bonus</div> : null
);

describe("WalletBalance", () => {
  beforeEach(() => {
    mockUser = null;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("does not render for a signed-out user", () => {
    render(<WalletBalance />);

    expect(screen.queryByRole("button", { name: "Wallet" })).toBeNull();
  });

  it("opens the daily bonus modal", () => {
    mockUser = {
      id: 7,
      username: "bonus-tester",
      balance: 10_000,
    };
    render(<WalletBalance />);

    fireEvent.click(screen.getByRole("button", { name: "Wallet" }));

    expect(screen.getByRole("dialog")).toHaveTextContent("Daily bonus");
  });

  it("stacks repeated balance gains and keeps only the newest two", () => {
    jest.useFakeTimers();
    mockUser = {
      id: 7,
      username: "roulette-tester",
      balance: 10_000,
    };
    const view = render(<WalletBalance />);

    mockUser = { ...mockUser, balance: 10_200 };
    view.rerender(<WalletBalance />);
    const firstHighlight = document.querySelector(".balance-win-highlight");

    mockUser = { ...mockUser, balance: 10_400 };
    view.rerender(<WalletBalance />);

    expect(screen.getAllByText("+200.00")).toHaveLength(2);
    expect(screen.getAllByText("+200.00")[1].parentElement).toHaveClass(
      "is-previous"
    );
    expect(document.querySelector(".balance-win-highlight")).not.toBe(
      firstHighlight
    );

    mockUser = { ...mockUser, balance: 10_600 };
    view.rerender(<WalletBalance />);

    expect(screen.getAllByText("+200.00")).toHaveLength(2);
    expect(screen.getAllByText("+200.00")[0].parentElement).not.toHaveClass(
      "is-previous"
    );
    expect(screen.getAllByText("+200.00")[1].parentElement).toHaveClass(
      "is-previous"
    );

    act(() => {
      jest.advanceTimersByTime(1800);
    });

    expect(screen.queryByText("+200.00")).toBeNull();
  });
});
