import assert from "node:assert/strict";
import test from "node:test";
import { createAdminService } from "../adminService.js";
import { DataStoreError } from "../../data/dataStore.js";

const permissions = [
  { id: 1, key: "user:reset_bonus", displayName: "Reset bonus" },
  { id: 2, key: "user:view", displayName: "View users" },
];
const roles = [
  { id: 10, key: "admin", displayName: "Administrator", permissions },
  { id: 11, key: "support", displayName: "Support", permissions: [permissions[1]] },
];
const baseUser = {
  id: 7,
  username: "bananaBoss",
  email: "boss@example.com",
  balance: 12_500,
  dailyBonusStreak: 4,
  lastDailyBonusClaimedOn: new Date("2026-08-04T00:00:00Z"),
  roles: [],
};

function createStore() {
  const calls = [];
  const store = {
    admin: {
      async searchUsers(input) {
        calls.push({ method: "searchUsers", input });
        return [baseUser];
      },
      async findUserById(userId) {
        calls.push({ method: "findUserById", userId });
        return userId === 7 ? baseUser : null;
      },
      async listRoles() {
        return roles;
      },
      async createRole(input) {
        calls.push({ method: "createRole", input });
        return { id: 12, ...input, permissions: [] };
      },
      async updateRole(roleId, input) {
        return { id: roleId, ...input, permissions: [] };
      },
      async deleteRole(roleId) {
        calls.push({ method: "deleteRole", roleId });
      },
      async setUserRoles(userId, roleIds) {
        calls.push({ method: "setUserRoles", userId, roleIds });
        return {
          ...baseUser,
          roles: roles.filter(({ id }) => roleIds.includes(id)),
        };
      },
      async listPermissions() {
        return permissions;
      },
      async setRolePermissions(roleId, permissionIds) {
        calls.push({ method: "setRolePermissions", roleId, permissionIds });
        return {
          ...roles[0],
          id: roleId,
          permissions: permissions.filter(({ id }) => permissionIds.includes(id)),
        };
      },
      async resetDailyBonus(userId) {
        calls.push({ method: "resetDailyBonus", userId });
        return { ...baseUser, dailyBonusStreak: 0, lastDailyBonusClaimedOn: null };
      },
    },
  };
  return { calls, store };
}

test("user search trims the query and always limits the directory", async () => {
  const { calls, store } = createStore();
  const result = await createAdminService(store).searchUsers("  boss@  ");

  assert.equal(result.data[0].username, "bananaBoss");
  assert.deepEqual(calls[0], {
    method: "searchUsers",
    input: { query: "boss@", limit: 12 },
  });
});

test("role creation normalizes keys and reports key conflicts", async () => {
  const { calls, store } = createStore();
  const service = createAdminService(store);
  const result = await service.createRole({
    key: "  SUPPORT_TEAM ",
    displayName: "  Support team  ",
  });

  assert.equal(result.data.key, "support_team");
  assert.deepEqual(calls.at(-1).input, {
    key: "support_team",
    displayName: "Support team",
  });

  store.admin.createRole = async () => {
    throw new DataStoreError("duplicate", "CONFLICT");
  };
  await assert.rejects(
    service.createRole({ key: "support", displayName: "Support" }),
    (error) => error.statusCode === 409 && error.code === "ROLE_KEY_TAKEN"
  );
});

test("users receive roles rather than direct permissions", async () => {
  const { calls, store } = createStore();
  const service = createAdminService(store);
  const result = await service.setUserRoles("7", [11, 11, 10]);

  assert.deepEqual(result.data.roles.map(({ id }) => id), [10, 11]);
  assert.deepEqual(calls.at(-1), {
    method: "setUserRoles",
    userId: 7,
    roleIds: [11, 10],
  });
  await assert.rejects(
    service.setUserRoles(7, [999]),
    (error) => error.statusCode === 404 && error.code === "NOT_FOUND"
  );
});

test("permissions are assigned to roles and unknown permissions are rejected", async () => {
  const { calls, store } = createStore();
  const service = createAdminService(store);
  const result = await service.setRolePermissions(10, [2, 2, 1]);

  assert.deepEqual(result.data.permissions.map(({ id }) => id), [1, 2]);
  assert.deepEqual(calls.at(-1), {
    method: "setRolePermissions",
    roleId: 10,
    permissionIds: [2, 1],
  });
  await assert.rejects(
    service.setRolePermissions(10, [999]),
    (error) => error.statusCode === 404 && error.code === "NOT_FOUND"
  );
});

test("daily bonus reset targets the selected user and preserves roles", async () => {
  const { calls, store } = createStore();
  const result = await createAdminService(store).resetDailyBonus(7);

  assert.equal(result.data.dailyBonusStreak, 0);
  assert.deepEqual(result.data.roles, []);
  assert.deepEqual(calls.at(-1), { method: "resetDailyBonus", userId: 7 });
});
