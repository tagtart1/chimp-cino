import assert from "node:assert/strict";
import test from "node:test";
import { createAuthService } from "../authService.js";

test("session validation returns current state and effective permissions", async () => {
  const service = createAuthService({
    users: {
      async findSessionById(userId) {
        assert.equal(userId, 7);
        return {
          balance: 1234,
          dailyBonusStreak: 3,
          lastDailyBonusClaimedOn: null,
          permissions: ["role:manage", "user:view"],
        };
      },
    },
  });

  assert.deepEqual(
    await service.validateSession({ id: 7, username: "admin" }),
    {
      id: 7,
      username: "admin",
      balance: 1234,
      dailyBonusStreak: 3,
      lastDailyBonusClaimedOn: null,
      permissions: ["role:manage", "user:view"],
    }
  );
});

test("session validation rejects users that no longer exist", async () => {
  const service = createAuthService({
    users: { async findSessionById() { return null; } },
  });

  await assert.rejects(
    service.validateSession({ id: 7, username: "deleted" }),
    (error) => error.statusCode === 401 && error.code === "TIMED_OUT"
  );
});
