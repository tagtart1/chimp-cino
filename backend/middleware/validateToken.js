const AppError = require("../utils/appError");
const jwt = require("jsonwebtoken");
const fetchJwtSecret = require("../utils/fetchJwtSecret");

// Verified and grabs user payload from JWT
const validateToken = async (req, res, next) => {
  const token = req.cookies.token;
  // maybe bug: need to see if this is actually returning an error
  if (!token) {
    throw new AppError(
      "Session timed out. Please sign up or log in",
      401,
      "SESSION_INVALID"
    );
  }
  const key = await fetchJwtSecret();
  jwt.verify(token, key, (err, data) => {
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
