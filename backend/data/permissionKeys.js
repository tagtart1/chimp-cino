export const flattenPermissionKeys = (roles = []) =>
  [
    ...new Set(
      roles.flatMap(({ permissions = [] }) =>
        permissions.map(({ key }) => key)
      )
    ),
  ].sort();
