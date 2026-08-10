import { registeredPermissions } from "../config/permissionRegistry.js";

export async function syncPermissionRegistry(
  client,
  permissions = registeredPermissions
) {
  return client.$transaction(
    permissions.map(({ key, displayName }) =>
      client.permission.upsert({
        where: { key },
        create: { key, displayName },
        update: { displayName },
      })
    )
  );
}
