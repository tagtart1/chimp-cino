import asyncHandler from "express-async-handler";
import { rouletteService } from "../services/index.js";

export const playGame = asyncHandler(async (req, res) => {
  const response = await rouletteService.play({
    userId: req.user.id,
    totalBet: req.totalBetAmount,
    betMap: req.body.betMap,
  });
  res.json(response);
});
