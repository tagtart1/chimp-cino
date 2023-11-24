const AppError = require("../utils/appError");
const jwt = require("jsonwebtoken");

// Verified and grabs user payload from JWT
const validateToken = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    throw new AppError(
      "Session timed out. Please sign up or log in",
      401,
      "SESSION_INVALID"
    );
  }

  jwt.verify(token, process.env.SECRETKEY, (err, data) => {
    if (err)
      throw new AppError(
        "Session timed out. Please sign up or log in",
        401,
        "SESSION_INVALID"
      );
    req.user = data.user;
    next();
  });
};

module.exports = validateToken;
