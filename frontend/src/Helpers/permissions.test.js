import {
  hasAnyPermission,
  hasPermission,
  PERMISSION_KEYS,
} from "./permissions";

describe("permission helpers", () => {
  const user = {
    permissions: [PERMISSION_KEYS.USER_VIEW, PERMISSION_KEYS.ROLE_MANAGE],
  };

  it("checks one permission safely", () => {
    expect(hasPermission(user, PERMISSION_KEYS.USER_VIEW)).toBe(true);
    expect(hasPermission(user, PERMISSION_KEYS.USER_RESET_BONUS)).toBe(false);
    expect(hasPermission(null, PERMISSION_KEYS.USER_VIEW)).toBe(false);
  });

  it("checks whether any permission is present", () => {
    expect(
      hasAnyPermission(user, [
        PERMISSION_KEYS.USER_RESET_BONUS,
        PERMISSION_KEYS.ROLE_MANAGE,
      ])
    ).toBe(true);
    expect(
      hasAnyPermission(user, [PERMISSION_KEYS.USER_RESET_BONUS])
    ).toBe(false);
  });
});
