import { render, screen } from "@testing-library/react";
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
jest.mock("../WalletBalance/WalletBalance", () => () =>
  mockUser ? <div data-testid="wallet-balance" /> : null
);

const renderHeader = () =>
  render(
    <MemoryRouter>
      <Header />
    </MemoryRouter>
  );

describe("Header", () => {
  beforeEach(() => {
    mockUser = null;
    mockSetUser.mockReset();
    mockOpenLogin.mockReset();
  });

  it("shows authentication actions to signed-out users", () => {
    renderHeader();

    expect(screen.getByRole("button", { name: "Sign In" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Register" })).toBeInTheDocument();
    expect(screen.queryByTestId("wallet-balance")).toBeNull();
    expect(mockOpenLogin).not.toHaveBeenCalled();
  });

  it("renders the wallet balance and account menu for signed-in users", () => {
    mockUser = {
      id: 7,
      username: "bonus-tester",
      balance: 10_000,
    };
    renderHeader();

    expect(screen.getByTestId("wallet-balance")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Open account menu" })
    ).toBeInTheDocument();
  });
});
