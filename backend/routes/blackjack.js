var express = require("express");
var router = express.Router();
const blackjackController = require("../controllers/blackjackController");
const validateToken = require("../middleware/validateToken");

router.post("/games", validateToken, blackjackController.newGame);

router.get("/games/in-progress", validateToken, blackjackController.getGame);

router.patch("/games/:gameId", blackjackController.action);

module.exports = router;
