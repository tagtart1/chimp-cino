const AppError = require("../../utils/appError");

const santizeTargetInput = (req, res, next) => {
  const minField = 0;
  const maxField = 24;

  const field = req.body.field;
  if (
    typeof field !== "number" ||
    !Number.isInteger(mines) ||
    isNaN(field) ||
    !isFinite(bet)
  ) {
    throw new AppError("Field must be a valid integer", 400, "INVALID_INPUT");
  }
  if (!field || field < minField || field > maxField) {
    throw new AppError(
      "Target field exceeds the bounds of the allowed selections",
      400,
      "INVALID_INPUT"
    );
  }

  next();
};

module.exports = santizeTargetInput;
