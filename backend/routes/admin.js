import express from "express";
import * as adminController from "../controllers/adminController.js";
import { permissionRegistry } from "../config/permissionRegistry.js";
import {
  requireAnyPermission,
  requirePermission,
} from "../middleware/requirePermission.js";
import validateToken from "../middleware/validateToken.js";

const router = express.Router();

router.use(validateToken);

router.get(
  "/users",
  requirePermission(permissionRegistry.USER_VIEW.key),
  adminController.searchUsers
);
router.get(
  "/users/:userId",
  requirePermission(permissionRegistry.USER_VIEW.key),
  adminController.getUser
);
router.post(
  "/users/:userId/daily-bonus/reset",
  requirePermission(permissionRegistry.USER_RESET_BONUS.key),
  adminController.resetDailyBonus
);
router.put(
  "/users/:userId/roles",
  requirePermission(permissionRegistry.USER_ASSIGN_ROLES.key),
  adminController.setUserRoles
);

router.get(
  "/roles",
  requireAnyPermission(
    permissionRegistry.USER_ASSIGN_ROLES.key,
    permissionRegistry.ROLE_MANAGE.key
  ),
  adminController.listRoles
);
router.post(
  "/roles",
  requirePermission(permissionRegistry.ROLE_MANAGE.key),
  adminController.createRole
);
router.patch(
  "/roles/:roleId",
  requirePermission(permissionRegistry.ROLE_MANAGE.key),
  adminController.updateRole
);
router.delete(
  "/roles/:roleId",
  requirePermission(permissionRegistry.ROLE_MANAGE.key),
  adminController.deleteRole
);
router.put(
  "/roles/:roleId/permissions",
  requirePermission(permissionRegistry.ROLE_MANAGE.key),
  adminController.setRolePermissions
);

router.get(
  "/permissions",
  requirePermission(permissionRegistry.ROLE_MANAGE.key),
  adminController.listPermissions
);

export default router;
