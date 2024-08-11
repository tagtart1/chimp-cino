var express = require("express");
var router = express.Router();
const minesController = require("../controllers/minesController");
const validateToken = require("../middleware/validateToken");
const beginTransaction = require("../middleware/mines/beginTransaction");

// Create a new mines game
router.post("/games", validateToken, beginTransaction, minesController.newGame);

// Fetch an active mines game
router.get("/games");

module.exports = router;
