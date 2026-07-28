import express from "express";
import * as analyticsController from "../controllers/analyticsController.js";
import validateToken from "../middleware/validateToken.js";

const router = express.Router();

router.get("/history", validateToken, analyticsController.getHistory);
router.get("/", validateToken, analyticsController.getAnalytics);

export default router;
