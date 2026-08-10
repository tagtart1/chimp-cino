import { registeredPermissions } from "../config/permissionRegistry.js";

export async function syncPermissionRegistry(
  client,
  permissions = registeredPermissions
) {
  const registeredKeys = permissions.map(({ key }) => key);
  const results = await client.$transaction([
    client.permission.deleteMany(
      registeredKeys.length
        ? { where: { key: { notIn: registeredKeys } } }
        : {}
    ),
    ...permissions.map(({ key, displayName }) =>
      client.permission.upsert({
        where: { key },
        create: { key, displayName },
        update: { displayName },
      })
    ),
  ]);

  return results.slice(1);
}
