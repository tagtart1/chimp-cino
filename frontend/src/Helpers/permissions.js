export const PERMISSION_KEYS = Object.freeze({
  USER_VIEW: "user:view",
  USER_RESET_BONUS: "user:reset_bonus",
  USER_ASSIGN_ROLES: "user:assign_roles",
  ROLE_MANAGE: "role:manage",
});

export const hasPermission = (user, permissionKey) =>
  Boolean(user?.permissions?.includes(permissionKey));

export const hasAnyPermission = (user, permissionKeys) =>
  permissionKeys.some((permissionKey) =>
    hasPermission(user, permissionKey)
  );
