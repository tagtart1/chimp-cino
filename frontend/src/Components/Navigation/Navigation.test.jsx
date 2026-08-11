import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";
import Navigation from "./Navigation";

let mockCurrentUser;

jest.mock("../../Contexts/UserProvider", () => ({
  useUser: () => ({ user: mockCurrentUser }),
}));

jest.mock("../StatsDrawer/StatsDrawer", () => () => null);

const setViewport = (matches) => {
  window.matchMedia = jest.fn().mockImplementation(() => ({
    matches,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  }));
};

const renderNavigation = () =>
  render(
    <MemoryRouter>
      <Navigation />
    </MemoryRouter>
  );

describe("Navigation admin permission", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("isSidebarOpen", "false");
    setViewport(false);
  });

  it("shows the desktop Admin item with user:view", () => {
    mockCurrentUser = { permissions: ["user:view"] };
    renderNavigation();
    expect(screen.getByRole("button", { name: "Admin" })).toBeInTheDocument();
  });

  it("hides the desktop Admin item without user:view", () => {
    mockCurrentUser = { permissions: ["role:manage"] };
    renderNavigation();
    expect(screen.queryByRole("button", { name: "Admin" })).not.toBeInTheDocument();
  });

  it("shows the collapsed Admin item with user:view", () => {
    localStorage.setItem("isSidebarOpen", "true");
    mockCurrentUser = { permissions: ["user:view"] };
    renderNavigation();
    expect(screen.getByRole("button", { name: "Admin" })).toBeInTheDocument();
  });

  it("uses the same permission gate in the mobile drawer", () => {
    setViewport(true);
    mockCurrentUser = { permissions: ["user:view"] };
    renderNavigation();
    fireEvent.click(screen.getByRole("button", { name: "Browse" }));
    expect(screen.getByRole("button", { name: "Admin" })).toBeInTheDocument();
  });
});
