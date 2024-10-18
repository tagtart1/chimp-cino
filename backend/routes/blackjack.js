var express = require("express");
var router = express.Router();
const blackjackController = require("../controllers/blackjackController");
const validateToken = require("../middleware/validateToken");
const fetchActiveGame = require("../middleware/blackjack/fetchActiveGame");
const fetchHandData = require("../middleware/fetchHandData");
const validateInsurance = require("../middleware/validateInsurance");
const fetchDealerHandData = require("../middleware/fetchDealerHandData");

router.post("/games", validateToken, blackjackController.newGame);

router.get(
  "/games/in-progress",
  validateToken,
  fetchActiveGame,
  fetchHandData,
  blackjackController.getGame
);

router.patch(
  "/games/hit",
  validateToken,
  fetchActiveGame,
  fetchHandData,
  validateInsurance,
  blackjackController.hit
);

router.patch(
  "/games/stand",
  validateToken,
  fetchActiveGame,
  fetchHandData,
  validateInsurance,
  blackjackController.stand
);

router.patch(
  "/games/double",
  validateToken,
  fetchActiveGame,
  fetchHandData,
  validateInsurance,
  blackjackController.double
);

router.patch(
  "/games/split",
  validateToken,
  fetchActiveGame,
  fetchHandData,
  validateInsurance,
  blackjackController.split
);

router.patch(
  "/games/insurance",
  validateToken,
  fetchActiveGame,

  fetchDealerHandData,
  blackjackController.insurance
);

module.exports = router;
