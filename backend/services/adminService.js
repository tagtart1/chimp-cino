import AppError from "../utils/appError.js";
import { DataStoreError } from "../data/dataStore.js";

const USER_RESULT_LIMIT = 12;
const ACCESS_KEY_PATTERN = /^[a-z][a-z0-9:_-]{1,99}$/;

function positiveId(value, label) {
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1) {
    throw new AppError(`${label} is invalid`, 400, "INVALID_INPUT");
  }
  return id;
}

function idList(values, label) {
  if (!Array.isArray(values)) {
    throw new AppError(`${label} must be an array`, 400, "INVALID_INPUT");
  }
  return [...new Set(values.map((id) => positiveId(id, label)))];
}

function accessInput(input, label) {
  const key = typeof input?.key === "string" ? input.key.trim().toLowerCase() : "";
  const displayName =
    typeof input?.displayName === "string" ? input.displayName.trim() : "";

  if (!ACCESS_KEY_PATTERN.test(key)) {
    throw new AppError(
      `${label} key must be 2-100 lowercase letters, numbers, colons, dashes, or underscores`,
      400,
      "INVALID_INPUT"
    );
  }
  if (!displayName || displayName.length > 100) {
    throw new AppError(
      `${label} name must be between 1 and 100 characters`,
      400,
      "INVALID_INPUT"
    );
  }

  return { key, displayName };
}

function translateAdminPersistenceError(error, entity = "Record") {
  if (error instanceof DataStoreError) {
    if (error.kind === "CONFLICT") {
      throw new AppError(
        `A ${entity.toLowerCase()} with that key already exists`,
        409,
        `${entity.toUpperCase()}_KEY_TAKEN`
      );
    }
    if (error.kind === "NOT_FOUND") {
      throw new AppError(`${entity} not found`, 404, "NOT_FOUND");
    }
  }
  throw error;
}

export function createAdminService(store) {
  const requireUser = async (userId) => {
    const user = await store.admin.findUserById(userId);
    if (!user) throw new AppError("User not found", 404, "NOT_FOUND");
    return user;
  };

  return {
    async searchUsers(rawQuery = "") {
      const query = typeof rawQuery === "string" ? rawQuery.trim() : "";
      if (query.length > 100) {
        throw new AppError(
          "Search must be 100 characters or fewer",
          400,
          "INVALID_INPUT"
        );
      }
      return {
        data: await store.admin.searchUsers({
          query,
          limit: USER_RESULT_LIMIT,
        }),
      };
    },

    async getUser(rawUserId) {
      return { data: await requireUser(positiveId(rawUserId, "User ID")) };
    },

    async resetDailyBonus(rawUserId) {
      const userId = positiveId(rawUserId, "User ID");
      await requireUser(userId);
      try {
        return { data: await store.admin.resetDailyBonus(userId) };
      } catch (error) {
        return translateAdminPersistenceError(error, "User");
      }
    },

    async setUserRoles(rawUserId, rawRoleIds) {
      const userId = positiveId(rawUserId, "User ID");
      const roleIds = idList(rawRoleIds, "Role IDs");
      await requireUser(userId);
      const existingIds = new Set(
        (await store.admin.listRoles()).map(({ id }) => id)
      );
      if (roleIds.some((id) => !existingIds.has(id))) {
        throw new AppError("Role not found", 404, "NOT_FOUND");
      }
      try {
        return { data: await store.admin.setUserRoles(userId, roleIds) };
      } catch (error) {
        return translateAdminPersistenceError(error, "Role");
      }
    },

    async listRoles() {
      return { data: await store.admin.listRoles() };
    },

    async createRole(input) {
      try {
        return {
          data: await store.admin.createRole(accessInput(input, "Role")),
        };
      } catch (error) {
        return translateAdminPersistenceError(error, "Role");
      }
    },

    async updateRole(rawRoleId, input) {
      const roleId = positiveId(rawRoleId, "Role ID");
      try {
        return {
          data: await store.admin.updateRole(
            roleId,
            accessInput(input, "Role")
          ),
        };
      } catch (error) {
        return translateAdminPersistenceError(error, "Role");
      }
    },

    async deleteRole(rawRoleId) {
      const roleId = positiveId(rawRoleId, "Role ID");
      try {
        await store.admin.deleteRole(roleId);
        return { data: { id: roleId } };
      } catch (error) {
        return translateAdminPersistenceError(error, "Role");
      }
    },

    async setRolePermissions(rawRoleId, rawPermissionIds) {
      const roleId = positiveId(rawRoleId, "Role ID");
      const permissionIds = idList(rawPermissionIds, "Permission IDs");
      const existingIds = new Set(
        (await store.admin.listPermissions()).map(({ id }) => id)
      );
      if (permissionIds.some((id) => !existingIds.has(id))) {
        throw new AppError("Permission not found", 404, "NOT_FOUND");
      }
      try {
        return {
          data: await store.admin.setRolePermissions(roleId, permissionIds),
        };
      } catch (error) {
        return translateAdminPersistenceError(error, "Role");
      }
    },

    async listPermissions() {
      return { data: await store.admin.listPermissions() };
    },
  };
}
