import asyncHandler from "express-async-handler";
import { minesService } from "../services/index.js";

export const newGame = asyncHandler(async (req, res) => {
  await minesService.start({
    userId: req.user.id,
    bet: req.body.bet,
    mines: req.body.mines,
  });
  res.sendStatus(200);
});

export const getGame = asyncHandler(async (req, res) => {
  res.status(200).json(await minesService.resume(req.user.id));
});

export const revealCell = asyncHandler(async (req, res) => {
  res.status(200).json(
    await minesService.reveal({
      userId: req.user.id,
      fields: req.body.fields,
    })
  );
});

export const cashout = asyncHandler(async (req, res) => {
  res.status(200).json(await minesService.cashout(req.user.id));
});
