import assert from "node:assert/strict";
import test from "node:test";
import jwt from "jsonwebtoken";
import sendTokenResponse from "../sendTokenResponse.js";

test("authentication returns permissions without embedding them in the JWT", async () => {
  const previousSecret = process.env.SECRETKEY;
  process.env.SECRETKEY = "test-secret";
  let token;

  try {
    const data = await new Promise((resolve, reject) => {
      sendTokenResponse(
        {
          user: {
            id: 7,
            username: "admin",
            balance: 1234,
            dailyBonusStreak: 3,
            lastDailyBonusClaimedOn: null,
            permissions: ["role:manage", "user:view"],
          },
        },
        {
          cookie(name, value) {
            assert.equal(name, "token");
            token = value;
          },
          json(payload) {
            resolve(payload.data);
          },
        },
        reject
      );
    });

    assert.deepEqual(data.permissions, ["role:manage", "user:view"]);
    assert.deepEqual(jwt.verify(token, process.env.SECRETKEY).user, {
      id: 7,
      username: "admin",
    });
  } finally {
    if (previousSecret === undefined) delete process.env.SECRETKEY;
    else process.env.SECRETKEY = previousSecret;
  }
});
