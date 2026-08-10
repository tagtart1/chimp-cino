import assert from "node:assert/strict";
import test from "node:test";
import {
  permissionRegistry,
  registeredPermissions,
} from "../../config/permissionRegistry.js";
import { syncPermissionRegistry } from "../syncPermissionRegistry.js";

test("the registry exposes the code-owned permissions", () => {
  assert.deepEqual(registeredPermissions, [
    { key: "role:manage", displayName: "Manage Roles" },
    { key: "permission:manage", displayName: "Manage Permissions" },
  ]);
  assert.equal(permissionRegistry.ROLE_MANAGE.key, "role:manage");
});

test("permission sync upserts registry rows without deleting anything", async () => {
  const calls = [];
  const client = {
    permission: {
      upsert(input) {
        calls.push(input);
        return Promise.resolve({ id: calls.length, ...input.create });
      },
    },
    $transaction(operations) {
      return Promise.all(operations);
    },
  };

  const result = await syncPermissionRegistry(client);

  assert.equal(result.length, 2);
  assert.deepEqual(calls, [
    {
      where: { key: "role:manage" },
      create: { key: "role:manage", displayName: "Manage Roles" },
      update: { displayName: "Manage Roles" },
    },
    {
      where: { key: "permission:manage" },
      create: {
        key: "permission:manage",
        displayName: "Manage Permissions",
      },
      update: { displayName: "Manage Permissions" },
    },
  ]);
});
