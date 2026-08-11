import asyncHandler from "express-async-handler";
import { authorizationService } from "../services/index.js";
import AppError from "../utils/appError.js";

export function createPermissionMiddleware(service) {
  const requireAnyPermission = (...permissionKeys) => {
    if (!permissionKeys.length) {
      throw new TypeError("At least one permission key is required");
    }

    return asyncHandler(async (req, res, next) => {
      if (!(await service.hasAnyPermission(req.user.id, permissionKeys))) {
        throw new AppError(
          "You do not have permission to perform this action",
          403,
          "FORBIDDEN"
        );
      }
      next();
    });
  };

  return {
    requirePermission: (permissionKey) =>
      requireAnyPermission(permissionKey),
    requireAnyPermission,
  };
}

export const { requirePermission, requireAnyPermission } =
  createPermissionMiddleware(authorizationService);
