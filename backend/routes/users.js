var express = require("express");
var router = express.Router();
const usersController = require("../controllers/usersController");
const sendTokenResponse = require("../middleware/sendTokenResponse");

/* GET users listing. */
router.post("/log-in", usersController.logIn, sendTokenResponse);
router.post("/sign-up", usersController.signUp, sendTokenResponse);

router.post("/log-out", usersController.logOut);
router.get("/validate-user", usersController.validateUser);

module.exports = router;
