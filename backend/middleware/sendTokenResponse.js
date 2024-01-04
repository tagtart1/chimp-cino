const jwt = require("jsonwebtoken");

const sendTokenResponse = (req, res, next) => {
  // Sign everything but password and balance

  const jwtUser = {
    id: req.user.id,
    username: req.user.username,

    last_bonus_claimed: req.user.last_bonus_claimed,
  };
  const returnedUser = jwtUser;
  returnedUser.balance = parseFloat(req.user.balance);

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
        data: returnedUser,
      });
    }
  );
};

module.exports = sendTokenResponse;
