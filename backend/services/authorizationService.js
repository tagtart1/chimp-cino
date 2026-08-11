export function createAuthorizationService(store) {
  return {
    async hasAnyPermission(userId, permissionKeys) {
      return store.users.hasAnyPermission(
        userId,
        [...new Set(permissionKeys)]
      );
    },
  };
}
