import assert from "node:assert/strict";
import test from "node:test";
import { createAuthorizationService } from "../authorizationService.js";

test("authorization checks current database permissions without duplicate keys", async () => {
  const calls = [];
  const service = createAuthorizationService({
    users: {
      async hasAnyPermission(userId, permissionKeys) {
        calls.push({ userId, permissionKeys });
        return permissionKeys.includes("user:view");
      },
    },
  });

  assert.equal(
    await service.hasAnyPermission(7, ["user:view", "user:view"]),
    true
  );
  assert.deepEqual(calls, [
    { userId: 7, permissionKeys: ["user:view"] },
  ]);
});
