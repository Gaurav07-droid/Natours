class AppError extends Error {
  constructor(message, statusCode) {
    super(message);

    this.isOperational = true;
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith(4) ? 'fail' : 'error';

    //stackTrace showas where the error actually happens
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
