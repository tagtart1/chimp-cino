var express = require("express");
var router = express.Router();
const blackjackController = require("../controllers/blackjackController");
const validateToken = require("../middleware/validateToken");
const fetchActiveGame = require("../middleware/fetchActiveGame");

router.post("/games", validateToken, blackjackController.newGame);

router.get("/games/in-progress", validateToken, blackjackController.getGame);

// Make serpate actions for changing game state
// like hit, stand, double down, and split

router.patch(
  "/games/hit",
  validateToken,
  fetchActiveGame,
  blackjackController.hit
);

router.patch(
  "/games/stand",
  validateToken,
  fetchActiveGame,
  blackjackController.stand
);

router.patch(
  "/games/double",
  validateToken,
  fetchActiveGame,
  blackjackController.double
);

router.patch(
  "/games/split",
  validateToken,
  fetchActiveGame,
  blackjackController.split
);

module.exports = router;
