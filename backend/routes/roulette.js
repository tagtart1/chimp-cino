var express = require("express");
var router = express.Router();
const validateToken = require("../middleware/validateToken");
const validateBetMap = require("../middleware/validateBetMap");
const rouletteController = require("../controllers/rouletteController");

/* GET users listing. */
router.patch("/", validateToken, validateBetMap, rouletteController.playGame);

module.exports = router;
