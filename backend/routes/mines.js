var express = require("express");
var router = express.Router();
const minesController = require("../controllers/minesController");
const validateToken = require("../middleware/validateToken");
const beginTransaction = require("../middleware/mines/beginTransaction");
const sanitizeInput = require("../middleware/mines/sanitizeInputs");

// Create a new mines game
router.post(
  "/games",
  validateToken,
  sanitizeInput,
  beginTransaction,
  minesController.newGame
);

// Fetch an active mines game
router.get("/games");

module.exports = router;
