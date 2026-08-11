import asyncHandler from "express-async-handler";
import { body, validationResult } from "express-validator";
import AppError from "../utils/appError.js";
import { authService, dailyBonusService } from "../services/index.js";

export const logIn = asyncHandler(async (req, res, next) => {
  const user = await authService.logIn({
    identifier: req.body.emailOrUsername,
    password: req.body.password,
  });
  req.user = await authService.validateSession(user);
  next();
});

export const signUp = [
  body("username", "Must have a username")
    .trim()
    .isLength({ min: 1 })
    .isAlphanumeric()
    .withMessage("Username can only contain letters and numbers")
    .escape(),
  body("email", "Must have an email")
    .trim()
    .isLength({ min: 1 })
    .isEmail()
    .withMessage("Must follow email format")
    .escape(),
  body("password")
    .isLength({ min: 1 })
    .withMessage("Password must contain 8 characters")
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,32}$/
    )
    .withMessage(
      "Password should have at least one uppercase letter, one number, and one special character"
    ),
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError(errors.array()[0].msg, 400, "VALIDATION_ERROR");
    }

    const user = await authService.signUp(req.body);
    req.user = await authService.validateSession(user);
    next();
  }),
];

export const logOut = (req, res) => {
  res.clearCookie("token", { path: "/" });
  res.status(200).json({ data: { message: "Logged out successfully" } });
};

export const validateUser = asyncHandler(async (req, res) => {
  res.json({
    data: await authService.validateSession(req.user),
  });
});

export const claimDailyBonus = asyncHandler(async (req, res) => {
  res.status(200).json(await dailyBonusService.claim(req.user.id));
});

export const resetDailyBonusForTesting = asyncHandler(async (req, res) => {
  res.status(200).json(await dailyBonusService.resetForTesting(req.user.id));
});
