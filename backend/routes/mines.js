import express from "express";
import * as minesController from "../controllers/minesController.js";
import validateToken from "../middleware/validateToken.js";
import sanitizeInput from "../middleware/mines/sanitizeInputs.js";
import sanitizeTargetInput from "../middleware/mines/sanitizeTargetInput.js";

const router = express.Router();

router.post(
  "/games",
  validateToken,
  sanitizeInput,
  minesController.newGame
);
router.get("/games", validateToken, minesController.getGame);
router.post(
  "/reveal",
  validateToken,
  sanitizeTargetInput,
  minesController.revealCell
);
router.post("/cashout", validateToken, minesController.cashout);

export default router;
