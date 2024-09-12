const AppError = require("../../utils/appError");

const santizeTargetInput = (req, res, next) => {
  const minField = 0;
  const maxField = 24;
  const maxFields = 26;

  const fields = req.body.fields;

  if (!Array.isArray(fields)) {
    throw new AppError("Fields must be an array", 400, "INVALID_INPUT");
  }
  // Interview: Explaim how this check saved your app from getting completely obliterated from someone sending in an array that is 5 trillion in size
  if (fields.length > maxFields) {
    throw new AppError("Passing in too many fields!", 400, "INVALID_INPUT");
  }
  // Check each field in the array
  for (const field of fields) {
    if (
      typeof field !== "number" ||
      !Number.isInteger(field) ||
      isNaN(field) ||
      !isFinite(field)
    ) {
      throw new AppError(
        "Each field must be a valid integer",
        400,
        "INVALID_INPUT"
      );
    }
    if (field < minField || field > maxField) {
      console.log(field);
      throw new AppError(
        "One or more fields exceed the bounds of the allowed selections",
        400,
        "INVALID_INPUT"
      );
    }
  }

  next();
};

module.exports = santizeTargetInput;
