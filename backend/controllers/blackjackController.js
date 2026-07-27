import asyncHandler from "express-async-handler";
import { blackjackService } from "../services/index.js";

export const newGame = asyncHandler(async (req, res) => {
  res.status(200).json(
    await blackjackService.newGame({
      userId: req.user.id,
      betAmount: req.body.betAmount,
    })
  );
});

export const getGame = asyncHandler(async (req, res) => {
  res.status(200).json(await blackjackService.getGame(req.user.id));
});

export const hit = asyncHandler(async (req, res) => {
  res.status(200).json(await blackjackService.hit(req.user.id));
});

export const stand = asyncHandler(async (req, res) => {
  res.status(200).json(await blackjackService.stand(req.user.id));
});

export const double = asyncHandler(async (req, res) => {
  res.status(200).json(await blackjackService.double(req.user.id));
});

export const split = asyncHandler(async (req, res) => {
  res.status(200).json(await blackjackService.split(req.user.id));
});

export const insurance = asyncHandler(async (req, res) => {
  res.status(200).json(
    await blackjackService.insurance({
      userId: req.user.id,
      acceptInsurance: req.body.acceptInsurance,
    })
  );
});
