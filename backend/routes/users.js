import express from "express";
import * as usersController from "../controllers/usersController.js";
import sendTokenResponse from "../middleware/sendTokenResponse.js";

const router = express.Router();

router.post("/log-in", usersController.logIn, sendTokenResponse);
router.post("/sign-up", usersController.signUp, sendTokenResponse);
router.post("/log-out", usersController.logOut);
router.get("/validate-user", usersController.validateUser);

export default router;
