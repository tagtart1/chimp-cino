var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
require("dotenv").config();
const cors = require("cors");

var indexRouter = require("./routes/index");
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

app.use("/", indexRouter);
app.use("/users", usersRouter);

module.exports = app;
