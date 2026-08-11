import { fetchSessionUser } from "./session";

describe("fetchSessionUser", () => {
  afterEach(() => jest.restoreAllMocks());

  it("returns the permission-bearing session user", async () => {
    global.fetch = jest.fn(async () => ({
      ok: true,
      json: async () => ({
        data: { id: 7, permissions: ["user:view"] },
      }),
    }));

    await expect(fetchSessionUser()).resolves.toEqual({
      id: 7,
      permissions: ["user:view"],
    });
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/users/validate-user"),
      { credentials: "include" }
    );
  });

  it("preserves the backend status and error code", async () => {
    global.fetch = jest.fn(async () => ({
      ok: false,
      status: 403,
      json: async () => ({ code: "FORBIDDEN", message: "No access" }),
    }));

    await expect(fetchSessionUser()).rejects.toMatchObject({
      code: "FORBIDDEN",
      status: 403,
      message: "No access",
    });
  });
});
