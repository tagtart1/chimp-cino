import express from "express";
import * as adminController from "../controllers/adminController.js";
import validateToken from "../middleware/validateToken.js";

const router = express.Router();

router.use(validateToken);

router.get("/users", adminController.searchUsers);
router.get("/users/:userId", adminController.getUser);
router.post(
  "/users/:userId/daily-bonus/reset",
  adminController.resetDailyBonus
);
router.put("/users/:userId/roles", adminController.setUserRoles);

router.get("/roles", adminController.listRoles);
router.post("/roles", adminController.createRole);
router.patch("/roles/:roleId", adminController.updateRole);
router.delete("/roles/:roleId", adminController.deleteRole);
router.put("/roles/:roleId/permissions", adminController.setRolePermissions);

router.get("/permissions", adminController.listPermissions);

export default router;
