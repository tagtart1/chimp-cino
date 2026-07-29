import bcrypt from "bcryptjs";
import AppError from "../utils/appError.js";
import { DataStoreError } from "../data/dataStore.js";

export function createAuthService(store) {
  return {
    async logIn({ identifier, password }) {
      if (!password || !identifier) {
        throw new AppError(
          "The username/email or password provided is empty",
          401,
          "INVALID_CREDENTIALS"
        );
      }

      const user = await store.users.findByLogin(identifier);
      if (!user || !(await bcrypt.compare(password, user.password))) {
        throw new AppError(
          "The username or password provided is incorrect",
          401,
          "INVALID_CREDENTIALS"
        );
      }
      return user;
    },

    async signUp({ username, email, password }) {
      if (await store.users.exists({ username, email })) {
        throw new AppError(
          "Username or email taken",
          400,
          "VALIDATION_ERROR"
        );
      }

      const hashedPassword = await bcrypt.hash(password, 12);
      let user;
      try {
        user = await store.users.create({
          username,
          email,
          password: hashedPassword,
          balance: 10_000,
        });
      } catch (error) {
        if (error instanceof DataStoreError && error.kind === "CONFLICT") {
          throw new AppError(
            "Username or email taken",
            400,
            "VALIDATION_ERROR"
          );
        }
        throw error;
      }

      if (!user) {
        throw new AppError("Failed to sign up", 500, "SERVER_ERROR");
      }
      return user;
    },

    async validateSession(user) {
      const state = await store.users.findStateById(user.id);
      if (!state) {
        throw new AppError(
          "User timed out, please log back in",
          401,
          "TIMED_OUT"
        );
      }
      return { ...user, ...state };
    },
  };
}
