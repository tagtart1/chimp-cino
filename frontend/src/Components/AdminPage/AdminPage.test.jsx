import { act } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import AdminPage from "./AdminPage";

const permissions = [
  { id: 1, key: "role:manage", displayName: "Manage Roles" },
  { id: 2, key: "permission:manage", displayName: "Manage Permissions" },
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

const jsonResponse = (data, ok = true) => ({
  ok,
  json: async () => (ok ? { data } : { message: data }),
});

describe("AdminPage", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    global.fetch = jest.fn(async (input, options = {}) => {
      const url = String(input);
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
    render(<AdminPage />);
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
    render(<AdminPage />);
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
    render(<AdminPage />);
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
          body: JSON.stringify({ permissionIds: [2, 1] }),
        })
      )
    );
    expect(
      await screen.findByText("Permissions updated for Administrator.")
    ).toBeInTheDocument();
  });

  it("shows the permission registry without permission CRUD controls", async () => {
    render(<AdminPage />);
    fireEvent.click(
      await screen.findByRole("button", { name: /Roles & permissions/i })
    );

    expect(await screen.findByText("role:manage")).toBeInTheDocument();
    expect(screen.getByText("permission:manage")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Create permission" })
    ).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Permission name")).not.toBeInTheDocument();
  });
});
