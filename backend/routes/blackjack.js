var express = require("express");
var router = express.Router();
const blackjackController = require("../controllers/blackjackController");
const validateToken = require("../middleware/validateToken");
const fetchActiveGame = require("../middleware/fetchActiveGame");
const fetchHandData = require("../middleware/fetchHandData");

router.post("/games", validateToken, blackjackController.newGame);

router.get("/games/in-progress", validateToken, blackjackController.getGame);

// Make serpate actions for changing game state
// like hit, stand, double down, and split

// TODO: Make a new middleware that concludes a game for split hand games

router.patch(
  "/games/hit",
  validateToken,
  fetchActiveGame,
  fetchHandData,
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
  fetchHandData,
  blackjackController.split
);

module.exports = router;
