export const permissionRegistry = Object.freeze({
  USER_VIEW: Object.freeze({
    key: "user:view",
    displayName: "View Users",
  }),
  USER_RESET_BONUS: Object.freeze({
    key: "user:reset_bonus",
    displayName: "Reset User Daily Bonus",
  }),
  USER_ASSIGN_ROLES: Object.freeze({
    key: "user:assign_roles",
    displayName: "Assign User Roles",
  }),
  ROLE_MANAGE: Object.freeze({
    key: "role:manage",
    displayName: "Manage Roles",
  }),
});

export const registeredPermissions = Object.freeze(
  Object.values(permissionRegistry)
);
