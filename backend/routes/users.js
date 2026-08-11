import express from "express";
import * as usersController from "../controllers/usersController.js";
import sendTokenResponse from "../middleware/sendTokenResponse.js";
import validateToken from "../middleware/validateToken.js";

const router = express.Router();

router.post("/log-in", usersController.logIn, sendTokenResponse);
router.post("/sign-up", usersController.signUp, sendTokenResponse);
router.post("/log-out", usersController.logOut);
router.post(
  "/daily-bonus/claim",
  validateToken,
  usersController.claimDailyBonus
);
router.post(
  "/daily-bonus/reset-for-testing",
  validateToken,
  usersController.resetDailyBonusForTesting
);
router.get("/validate-user", validateToken, usersController.validateUser);

export default router;
