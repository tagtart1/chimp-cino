const jwt = require("jsonwebtoken");

const sendTokenResponse = (req, res, next) => {
  // Sign everything but password

  const jwtUser = {
    id: req.user.id,
    username: req.user.username,
    balance: req.user.balance,
    last_bonus_claimed: req.user.last_bonus_claimed,
  };

  jwt.sign(
    { user: jwtUser },
    process.env.SECRETKEY,
    { expiresIn: "3h" },
    (err, token) => {
      if (err) return next(err);

      res.cookie("token", token, {
        httpOnly: true,
        maxAge: 10800000,
        path: "/",
      });

      res.json({
        data: jwtUser,
      });
    }
  );
};

module.exports = sendTokenResponse;
