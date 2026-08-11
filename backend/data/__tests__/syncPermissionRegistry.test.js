import assert from "node:assert/strict";
import test from "node:test";
import {
  permissionRegistry,
  registeredPermissions,
} from "../../config/permissionRegistry.js";
import { syncPermissionRegistry } from "../syncPermissionRegistry.js";

test("the registry exposes the code-owned permissions", () => {
  assert.deepEqual(registeredPermissions, [
    { key: "user:view", displayName: "View Users" },
    { key: "user:reset_bonus", displayName: "Reset User Daily Bonus" },
    { key: "user:assign_roles", displayName: "Assign User Roles" },
    { key: "role:manage", displayName: "Manage Roles" },
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

  assert.equal(result.length, 4);
  assert.deepEqual(deleteCalls, [
    {
      where: {
        key: {
          notIn: [
            "user:view",
            "user:reset_bonus",
            "user:assign_roles",
            "role:manage",
          ],
        },
      },
    },
  ]);
  assert.deepEqual(upsertCalls, [
    {
      where: { key: "user:view" },
      create: { key: "user:view", displayName: "View Users" },
      update: { displayName: "View Users" },
    },
    {
      where: { key: "user:reset_bonus" },
      create: {
        key: "user:reset_bonus",
        displayName: "Reset User Daily Bonus",
      },
      update: { displayName: "Reset User Daily Bonus" },
    },
    {
      where: { key: "user:assign_roles" },
      create: { key: "user:assign_roles", displayName: "Assign User Roles" },
      update: { displayName: "Assign User Roles" },
    },
    {
      where: { key: "role:manage" },
      create: { key: "role:manage", displayName: "Manage Roles" },
      update: { displayName: "Manage Roles" },
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
