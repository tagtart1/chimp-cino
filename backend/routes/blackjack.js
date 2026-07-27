import express from "express";
import * as blackjackController from "../controllers/blackjackController.js";
import validateToken from "../middleware/validateToken.js";

const router = express.Router();

router.post("/games", validateToken, blackjackController.newGame);
router.get(
  "/games/in-progress",
  validateToken,
  blackjackController.getGame
);
router.patch("/games/hit", validateToken, blackjackController.hit);
router.patch("/games/stand", validateToken, blackjackController.stand);
router.patch("/games/double", validateToken, blackjackController.double);
router.patch("/games/split", validateToken, blackjackController.split);
router.patch(
  "/games/insurance",
  validateToken,
  blackjackController.insurance
);

export default router;
