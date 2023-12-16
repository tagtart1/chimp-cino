const jwt = require("jsonwebtoken");
const fetchJwtSecret = require("../utils/fetchJwtSecret");

const sendTokenResponse = async (req, res, next) => {
  // Sign everything but password and balance

  const jwtUser = {
    id: req.user.id,
    username: req.user.username,

    last_bonus_claimed: req.user.last_bonus_claimed,
  };
  const returnedUser = jwtUser;
  returnedUser.balance = req.user.balance;
  const key = await fetchJwtSecret();
  jwt.sign({ user: jwtUser }, key, { expiresIn: "3h" }, (err, token) => {
    if (err) return next(err);

    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 10800000,
      path: "/",
    });

    res.json({
      data: returnedUser,
    });
  });
};

module.exports = sendTokenResponse;
