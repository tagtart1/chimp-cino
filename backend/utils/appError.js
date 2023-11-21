class AppError extends Error {
  constructor(message, statusCode, code) {
    super(message);

    this.statusCode = statusCode;
    this.isOperational = true;
    this.code = code;
  }
}

module.exports = AppError;
