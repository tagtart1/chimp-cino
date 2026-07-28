import asyncHandler from "express-async-handler";
import { analyticsService } from "../services/index.js";

export const getAnalytics = asyncHandler(async (req, res) => {
  res.status(200).json(
    await analyticsService.getAnalytics({
      userId: req.user.id,
      range: req.query.range ?? "all",
      game: req.query.game ?? "all",
    })
  );
});

export const getHistory = asyncHandler(async (req, res) => {
  res.status(200).json(
    await analyticsService.getHistory({
      userId: req.user.id,
      game: req.query.game ?? "all",
      limit: req.query.limit ?? "25",
      cursor: req.query.cursor,
    })
  );
});
