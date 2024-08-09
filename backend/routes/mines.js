var express = require("express");
var router = express.Router();
const minesController = require("../controllers/minesController");
const validateToken = require("../middleware/validateToken");

// Create a new mines game
router.post("/games");

// Fetch an active mines game
router.get("/games");

module.exports = router;
