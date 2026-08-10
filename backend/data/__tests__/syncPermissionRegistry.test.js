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

test("permission sync deletes unregistered rows and upserts registry rows", async () => {
  const deleteCalls = [];
  const upsertCalls = [];
  const client = {
    permission: {
      deleteMany(input) {
        deleteCalls.push(input);
        return Promise.resolve({ count: 1 });
      },
      upsert(input) {
        upsertCalls.push(input);
        return Promise.resolve({ id: upsertCalls.length, ...input.create });
      },
    },
    $transaction(operations) {
      return Promise.all(operations);
    },
  };

  const result = await syncPermissionRegistry(client);

  assert.equal(result.length, 2);
  assert.deepEqual(deleteCalls, [
    {
      where: {
        key: { notIn: ["role:manage", "permission:manage"] },
      },
    },
  ]);
  assert.deepEqual(upsertCalls, [
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

test("permission sync deletes every row when the registry is empty", async () => {
  const deleteCalls = [];
  const client = {
    permission: {
      deleteMany(input) {
        deleteCalls.push(input);
        return Promise.resolve({ count: 2 });
      },
      upsert() {
        throw new Error("upsert should not be called");
      },
    },
    $transaction(operations) {
      return Promise.all(operations);
    },
  };

  const result = await syncPermissionRegistry(client, []);

  assert.deepEqual(result, []);
  assert.deepEqual(deleteCalls, [{}]);
});
