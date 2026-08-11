import assert from "node:assert/strict";
import test from "node:test";
import { flattenPermissionKeys } from "../permissionKeys.js";

test("permission keys are flattened, deduplicated, and sorted", () => {
  assert.deepEqual(
    flattenPermissionKeys([
      {
        permissions: [
          { key: "user:view" },
          { key: "role:manage" },
        ],
      },
      {
        permissions: [
          { key: "user:reset_bonus" },
          { key: "user:view" },
        ],
      },
    ]),
    ["role:manage", "user:reset_bonus", "user:view"]
  );
});
