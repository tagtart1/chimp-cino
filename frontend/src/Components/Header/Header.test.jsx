import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";
import Header from "./Header";

let mockUser;
const mockSetUser = jest.fn();
const mockOpenLogin = jest.fn();

jest.mock("../../Contexts/UserProvider", () => ({
  useUser: () => ({ user: mockUser, setUser: mockSetUser }),
}));

jest.mock("../../Contexts/AuthPopupProvider", () => ({
  useAuthPopup: () => ({
    isLogIn: true,
    isVisible: false,
    openLogin: mockOpenLogin,
    openSignUp: jest.fn(),
    closeAuth: jest.fn(),
  }),
}));

jest.mock("../AuthPopup/AuthPopup", () => () => null);
jest.mock("../DailyBonusModal/DailyBonusModal", () => ({ isOpen }) =>
  isOpen ? <div role="dialog">Daily bonus</div> : null
);

const renderHeader = () =>
  render(
    <MemoryRouter>
      <Header />
    </MemoryRouter>
  );

describe("Header wallet", () => {
  beforeEach(() => {
    mockUser = null;
    mockSetUser.mockReset();
    mockOpenLogin.mockReset();
  });

  it("hides the wallet from signed-out users", () => {
    renderHeader();

    expect(screen.queryByRole("button", { name: "Wallet" })).toBeNull();
    expect(mockOpenLogin).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("opens the daily bonus for a signed-in user", () => {
    mockUser = {
      id: 7,
      username: "bonus-tester",
      balance: 10_000,
      dailyBonusStreak: 2,
      lastDailyBonusClaimedOn: null,
    };
    renderHeader();

    fireEvent.click(screen.getByRole("button", { name: "Wallet" }));

    expect(screen.getByRole("dialog")).toHaveTextContent("Daily bonus");
    expect(mockOpenLogin).not.toHaveBeenCalled();
  });
});
