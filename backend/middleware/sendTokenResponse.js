import jwt from "jsonwebtoken";

const sendTokenResponse = (req, res, next) => {
  // Sign everything but password and balance

  const jwtUser = {
    id: req.user.id,
    username: req.user.username,
  };
  const returnedUser = {
    ...jwtUser,
    balance: parseFloat(req.user.balance),
    dailyBonusStreak: req.user.dailyBonusStreak,
    lastDailyBonusClaimedOn: req.user.lastDailyBonusClaimedOn,
    permissions: req.user.permissions ?? [],
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
        data: returnedUser,
      });
    }
  );
};

export default sendTokenResponse;
