var express = require("express");
var router = express.Router();
const minesController = require("../controllers/minesController");
const validateToken = require("../middleware/validateToken");

module.exports = router;
