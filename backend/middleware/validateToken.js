import AppError from "../utils/appError.js";
import jwt from "jsonwebtoken";

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

export default validateToken;
