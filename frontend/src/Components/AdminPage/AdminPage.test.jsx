import { act } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";
import AdminPage from "./AdminPage";

const mockSetUser = jest.fn();
const mockOpenLogin = jest.fn();
let mockCurrentUser;

jest.mock("../../Contexts/UserProvider", () => ({
  useUser: () => ({ user: mockCurrentUser, setUser: mockSetUser }),
}));

jest.mock("../../Contexts/AuthPopupProvider", () => ({
  useAuthPopup: () => ({ openLogin: mockOpenLogin }),
}));

const permissions = [
  { id: 1, key: "user:view", displayName: "View Users" },
  { id: 2, key: "user:reset_bonus", displayName: "Reset User Daily Bonus" },
  { id: 3, key: "user:assign_roles", displayName: "Assign User Roles" },
  { id: 4, key: "role:manage", displayName: "Manage Roles" },
];
const roles = [
  {
    id: 10,
    key: "admin",
    displayName: "Administrator",
    permissions: [permissions[1]],
  },
  {
    id: 11,
    key: "support",
    displayName: "Support",
    permissions: [],
  },
];
const user = {
  id: 7,
  username: "bananaBoss",
  email: "boss@example.com",
  balance: 12_500,
  dailyBonusStreak: 4,
  lastDailyBonusClaimedOn: "2026-08-04T00:00:00.000Z",
  roles: [roles[0]],
};
const adminSession = {
  id: 99,
  username: "admin",
  permissions: permissions.map(({ key }) => key),
};

const jsonResponse = (data, ok = true) => ({
  ok,
  status: ok ? 200 : 403,
  json: async () => (ok ? { data } : { message: data }),
});

const renderAdminPage = () =>
  render(
    <MemoryRouter>
      <AdminPage />
    </MemoryRouter>
  );

describe("AdminPage", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockCurrentUser = adminSession;
    mockSetUser.mockClear();
    mockOpenLogin.mockClear();
    global.fetch = jest.fn(async (input, options = {}) => {
      const url = String(input);
      if (url.includes("/users/validate-user")) {
        return jsonResponse(adminSession);
      }
      if (url.includes("/admin/users/7/daily-bonus/reset")) {
        return jsonResponse({
          ...user,
          dailyBonusStreak: 0,
          lastDailyBonusClaimedOn: null,
        });
      }
      if (url.includes("/admin/users/7/roles")) {
        return jsonResponse({ ...user, roles });
      }
      if (url.includes("/admin/roles/10/permissions")) {
        return jsonResponse({ ...roles[0], permissions });
      }
      if (url.endsWith("/admin/roles") && options.method === "POST") {
        return jsonResponse({
          id: 12,
          ...JSON.parse(options.body),
          permissions: [],
        });
      }
      if (url.endsWith("/admin/roles")) return jsonResponse(roles);
      if (url.endsWith("/admin/permissions")) return jsonResponse(permissions);
      if (url.endsWith("/admin/users/7")) return jsonResponse(user);
      if (url.includes("/admin/users")) return jsonResponse([user]);
      throw new Error(`Unexpected request: ${url} ${options.method || "GET"}`);
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("debounces backend search by username or email", async () => {
    renderAdminPage();
    await waitFor(() => expect(screen.getByText("bananaBoss")).toBeInTheDocument());
    global.fetch.mockClear();

    fireEvent.change(screen.getByLabelText("Search users"), {
      target: { value: "boss@" },
    });
    expect(global.fetch).not.toHaveBeenCalled();

    await act(async () => jest.advanceTimersByTime(300));
    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/admin/users?q=boss%40"),
        expect.objectContaining({ credentials: "include" })
      )
    );
  });

  it("assigns roles to users instead of assigning permissions directly", async () => {
    renderAdminPage();
    fireEvent.click(await screen.findByRole("button", { name: /bananaBoss/i }));

    expect(await screen.findByText("Assigned roles")).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("checkbox", { name: /Support support/i })
    );
    fireEvent.click(screen.getByRole("button", { name: "Save roles" }));

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/admin/users/7/roles"),
        expect.objectContaining({
          method: "PUT",
          body: JSON.stringify({ roleIds: [10, 11] }),
        })
      )
    );
    expect(
      await screen.findByText("Roles updated for bananaBoss.")
    ).toBeInTheDocument();
  });

  it("uses a separate access section to assign permissions to roles", async () => {
    renderAdminPage();
    fireEvent.click(
      await screen.findByRole("button", { name: /Roles & permissions/i })
    );
    fireEvent.click(
      await screen.findByRole("button", { name: /Administrator admin/i })
    );

    expect(screen.getByText("Permissions on this role")).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("checkbox", { name: /Manage Roles role:manage/i })
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Save permissions" })
    );

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/admin/roles/10/permissions"),
        expect.objectContaining({
          method: "PUT",
          body: JSON.stringify({ permissionIds: [2, 4] }),
        })
      )
    );
    expect(
      await screen.findByText("Permissions updated for Administrator.")
    ).toBeInTheDocument();
  });

  it("shows the permission registry without permission CRUD controls", async () => {
    renderAdminPage();
    fireEvent.click(
      await screen.findByRole("button", { name: /Roles & permissions/i })
    );

    expect(await screen.findByText("user:view")).toBeInTheDocument();
    expect(screen.getByText("user:reset_bonus")).toBeInTheDocument();
    expect(screen.getByText("user:assign_roles")).toBeInTheDocument();
    expect(screen.getByText("role:manage")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Create permission" })
    ).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Permission name")).not.toBeInTheDocument();
  });

  it("does not mount the admin workspace without user:view", () => {
    mockCurrentUser = { id: 8, username: "player", permissions: [] };

    renderAdminPage();

    expect(screen.getByText("Access denied")).toBeInTheDocument();
    expect(screen.getByText("This control room is off limits.")).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("offers sign in without mounting the workspace when signed out", () => {
    mockCurrentUser = null;

    renderAdminPage();
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(screen.getByText("Sign in required")).toBeInTheDocument();
    expect(mockOpenLogin).toHaveBeenCalledTimes(1);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("loads only user data and hides privileged controls with user:view alone", async () => {
    mockCurrentUser = {
      id: 8,
      username: "viewer",
      permissions: ["user:view"],
    };

    renderAdminPage();
    fireEvent.click(await screen.findByRole("button", { name: /bananaBoss/i }));
    await screen.findByText("Player #7");

    expect(screen.queryByRole("button", { name: "Reset bonus" })).not.toBeInTheDocument();
    expect(screen.queryByText("Assigned roles")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Roles & permissions/i })).not.toBeInTheDocument();
    expect(
      global.fetch.mock.calls.some(([url]) => String(url).endsWith("/admin/roles"))
    ).toBe(false);
    expect(
      global.fetch.mock.calls.some(([url]) => String(url).endsWith("/admin/permissions"))
    ).toBe(false);
  });

  it("shows bonus reset without exposing role controls", async () => {
    mockCurrentUser = {
      id: 8,
      username: "bonus-admin",
      permissions: ["user:view", "user:reset_bonus"],
    };

    renderAdminPage();
    fireEvent.click(await screen.findByRole("button", { name: /bananaBoss/i }));

    expect(
      await screen.findByRole("button", { name: "Reset bonus" })
    ).toBeInTheDocument();
    expect(screen.queryByText("Assigned roles")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Roles & permissions/i })
    ).not.toBeInTheDocument();
    expect(
      global.fetch.mock.calls.some(([url]) =>
        String(url).endsWith("/admin/roles")
      )
    ).toBe(false);
  });

  it("loads role choices for role assignment without exposing role management", async () => {
    mockCurrentUser = {
      id: 8,
      username: "role-assigner",
      permissions: ["user:view", "user:assign_roles"],
    };

    renderAdminPage();
    await waitFor(() =>
      expect(
        global.fetch.mock.calls.some(([url]) =>
          String(url).endsWith("/admin/roles")
        )
      ).toBe(true)
    );
    fireEvent.click(await screen.findByRole("button", { name: /bananaBoss/i }));

    expect(await screen.findByText("Assigned roles")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Reset bonus" })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Roles & permissions/i })
    ).not.toBeInTheDocument();
    expect(
      global.fetch.mock.calls.some(([url]) =>
        String(url).endsWith("/admin/permissions")
      )
    ).toBe(false);
  });
});
