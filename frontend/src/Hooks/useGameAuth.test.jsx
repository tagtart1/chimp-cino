import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import {
  AuthPopupProvider,
  useAuthPopup,
} from "../Contexts/AuthPopupProvider";
import { UserProvider } from "../Contexts/UserProvider";
import useGameAuth from "./useGameAuth";

const AuthHarness = () => {
  const { requireAuth } = useGameAuth();
  const { isVisible, isLogIn } = useAuthPopup();

  return (
    <>
      <button onClick={requireAuth}>Play</button>
      <output>{isVisible && isLogIn ? "login-open" : "closed"}</output>
    </>
  );
};

describe("useGameAuth", () => {
  it("opens the login flow when a wager action requires auth", () => {
    render(
      <UserProvider>
        <AuthPopupProvider>
          <AuthHarness />
        </AuthPopupProvider>
      </UserProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    expect(screen.getByText("login-open")).toBeInTheDocument();
  });
});
