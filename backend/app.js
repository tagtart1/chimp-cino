import "./utils/loadEnv.js";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import cookieParser from "cookie-parser";
import logger from "morgan";
import cors from "cors";
import AppError from "./utils/appError.js";
import rouletteRouter from "./routes/roulette.js";
import usersRouter from "./routes/users.js";
import blackjackRouter from "./routes/blackjack.js";
import minesRouter from "./routes/mines.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(
  cors({
    origin: ["http://localhost:3010", "https://www.chimpcino.com"],
    credentials: true,
    optionsSuccessStatus: 200,
  })
);
app.use(
  "/favicon.ico",
  express.static(path.join(__dirname, "utils/chimcino-logo.png"))
);

app.use("/api/v1/roulette", rouletteRouter);
app.use("/api/v1/users", usersRouter);
app.use("/api/v1/blackjack", blackjackRouter);
app.use("/api/v1/mines", minesRouter);

app.use((err, req, res, next) => {
  if (err instanceof AppError && err.isOperational) {
    console.log(err);
    return res
      .status(err.statusCode)
      .json({ code: err.code, message: err.message });
  }

  console.error("An unknown error occurred:", err);
  return res
    .status(500)
    .json({ code: "UNKNOWN", message: "An unexpected error occurred" });
});

export default app;
