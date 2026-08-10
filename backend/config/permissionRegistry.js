export const permissionRegistry = Object.freeze({
  ROLE_MANAGE: Object.freeze({
    key: "role:manage",
    displayName: "Manage Roles",
  }),
  PERMISSION_MANAGE: Object.freeze({
    key: "permission:manage",
    displayName: "Manage Permissions",
  }),
});

export const registeredPermissions = Object.freeze(
  Object.values(permissionRegistry)
);
