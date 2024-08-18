var express = require("express");
var router = express.Router();
const minesController = require("../controllers/minesController");
const validateToken = require("../middleware/validateToken");
const beginTransaction = require("../middleware/mines/beginTransaction");
const sanitizeInput = require("../middleware/mines/sanitizeInputs");
const withdrawBalance = require("../middleware/mines/withdrawBalance");
const santizeTargetInput = require("../middleware/mines/sanitizeTargetInput");
const fetchActiveGame = require("../middleware/mines/fetchActiveGame");
// Create a new mines game
router.post(
  "/games",
  validateToken,
  sanitizeInput,
  beginTransaction,
  withdrawBalance,
  minesController.newGame
);

// Fetch an active mines game
router.get("/games", validateToken, fetchActiveGame, minesController.getGame);

// Reveal a cell
router.post(
  "/reveal",
  validateToken,
  fetchActiveGame,
  santizeTargetInput,
  beginTransaction,
  minesController.revealCell
);

module.exports = router;
