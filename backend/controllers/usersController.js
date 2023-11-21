const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcryptjs");
const { body, validationResult } = require("express-validator");
const AppError = require("../utils/appError");
const pool = require("../db");
const userQueries = require("../queries/userQueries");

exports.logIn = asyncHandler(async (req, res, next) => {
  const inputEmailOrUsername = req.body.emailOrUsername;
  const inputPassword = req.body.password;

  // Null values fail credential check automatically
  if (!inputPassword || !inputEmailOrUsername) {
    throw new AppError(
      "The username/email or password provided is incorrect",
      401,
      "INVALID_CREDENTIALS"
    );
  }

  // Find user

  const user = (
    await pool.query(userQueries.getUserByUsernameOrEmail, [
      inputEmailOrUsername,
    ])
  ).rows[0];

  if (!user) {
    throw new AppError(
      "The username or password provided is incorrect",
      401,
      "INVALID_CREDENTIALS"
    );
  }

  // Authenticate password
  const result = await bcrypt.compare(inputPassword, user.password);
  if (!result) {
    console.log("failed compare");
    throw new AppError(
      "The username or password provided is incorrect",
      401,
      "INVALID_CREDENTIALS"
    );
  }

  req.user = user;
  next();
});

exports.signUp = [
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
      const formattedErrors = errors.array().map((err) => err.msg);
      throw new AppError(formattedErrors[0], 400, "VALIDATION_ERROR");
    }

    // Check if user already exists
    const usernameOrEmailExists = await pool.query(
      userQueries.checkIfUserExists,
      [req.body.username, req.body.email]
    );

    // Seperate errors later
    if (usernameOrEmailExists.rows[0].count !== "0") {
      console.log(usernameOrEmailExists);
      throw new AppError("Username or email taken", 400, "VALIDATION_ERROR");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(req.body.password, 12);

    const newUser = (
      await pool.query(userQueries.addNewUser, [
        req.body.username,
        req.body.email.toLowerCase(),
        hashedPassword,
        0.0,
      ])
    ).rows[0];

    if (!newUser) {
      throw new AppError("Failed to sign up", 500, "SERVER_ERROR");
    }

    // Add user to req
    req.user = newUser;
    // Send token res in next
    next();
  }),
];

exports.logOut = (req, res) => {
  res.clearCookie("token", { path: "/" });
  res.status(200).json({ data: { message: "Logged out successfully" } });
};

exports.validateUser = asyncHandler(async (req, res) => {
  const token = req.cookies.token;

  jwt.verify(token, process.env.SECRETKEY, (err, userData) => {
    if (err) {
      throw new AppError(
        "User timed out, please log back in",
        401,
        "TIMED_OUT"
      );
    } else {
      return res.json({ data: userData });
    }
  });
});
