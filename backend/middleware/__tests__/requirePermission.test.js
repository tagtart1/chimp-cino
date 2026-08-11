import assert from "node:assert/strict";
import test from "node:test";
import { createPermissionMiddleware } from "../requirePermission.js";

const run = (middleware, req) =>
  new Promise((resolve) => middleware(req, {}, resolve));

test("permission middleware continues when any required permission is granted", async () => {
  const calls = [];
  const { requireAnyPermission } = createPermissionMiddleware({
    async hasAnyPermission(userId, permissionKeys) {
      calls.push({ userId, permissionKeys });
      return true;
    },
  });

  const error = await run(
    requireAnyPermission("user:assign_roles", "role:manage"),
    { user: { id: 7 } }
  );

  assert.equal(error, undefined);
  assert.deepEqual(calls, [
    {
      userId: 7,
      permissionKeys: ["user:assign_roles", "role:manage"],
    },
  ]);
});

test("permission middleware fails closed with a 403", async () => {
  const { requirePermission } = createPermissionMiddleware({
    async hasAnyPermission() { return false; },
  });

  const error = await run(requirePermission("user:view"), {
    user: { id: 7 },
  });

  assert.equal(error.statusCode, 403);
  assert.equal(error.code, "FORBIDDEN");
});

test("permission middleware rejects an empty permission policy", () => {
  const { requireAnyPermission } = createPermissionMiddleware({});
  assert.throws(
    () => requireAnyPermission(),
    /At least one permission key is required/
  );
});
