import express from "express";
import validateToken from "../middleware/validateToken.js";
import validateBetMap from "../middleware/validateBetMap.js";
import * as rouletteController from "../controllers/rouletteController.js";

const router = express.Router();

router.patch("/", validateToken, validateBetMap, rouletteController.playGame);

export default router;
