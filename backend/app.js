var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
require("dotenv").config();
const cors = require("cors");
const AppError = require("./utils/appError");
var rouletteRouter = require("./routes/roulette");
var usersRouter = require("./routes/users");

var app = express();

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(
  cors({
    origin: ["http://localhost:3000"],
    credentials: true,
    optionsSuccessStatus: 200,
  })
);
// Serve favicon - avoids log
app.use(
  "/favicon.ico",
  express.static(path.join(__dirname, "utils/chimcino-logo.png"))
);

// Routes
app.use("/api/v1/roulette", rouletteRouter);
app.use("/api/v1/users", usersRouter);

// Error Handler
app.use((err, req, res, next) => {
  if (err instanceof AppError && err.isOperational) {
    // Handle operational errors by returning a specific error message to the client.
    console.log(err);
    return res
      .status(err.statusCode)
      .json({ code: err.code, message: err.message });
  }

  // Handle other unknown errors.
  console.error("An unknown error occurred:", err);
  res
    .status(500)
    .json({ code: "UNKNOWN", message: "An unexpected error occurred" });
});

module.exports = app;
