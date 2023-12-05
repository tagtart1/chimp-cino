var express = require("express");
var router = express.Router();
const blackjackController = require("../controllers/blackjackController");
const validateToken = require("../middleware/validateToken");

router.post("/start", validateToken, blackjackController.newGame);

router.patch("/action", blackjackController.action);

module.exports = router;
