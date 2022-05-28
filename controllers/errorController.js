const AppError = require('../utils/appError');

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}:${err.value} `;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const message = `Duplicate field value "${err.keyValue.name}".Please try entering anotherOne`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const error = Object.values(err.errors).map((el) => {
    return el.message;
  });
  const message = `Invalid input data. ${error.join('. ')};`;
  return new AppError(message, 400);
};

const handleJWTError = () => {
  // const message = err.message;
  return new AppError('Invalid token.Please login again!', 401);
};

const handleTokenExpError = () => {
  return new AppError('Token expired! please login again!', 401);
};

const sendErrorDev = (err, req, res) => {
  //API
  if (req.originalUrl.startsWith('/api')) {
    res.status(err.statusCode).json({
      error: err,
      status: err.status,
      message: err.message,
      stack: err.stack,
    });
  } else {
    //RENDERED WEBSITE
    // console.log('error', err);
    res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: err.message,
    });
  }
};

const sendErrorProd = (err, req, res) => {
  //A) API
  if (req.originalUrl.startsWith('/api')) {
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    } else {
      //1) Log error
      console.error('ERROR💥', err);
      //Programming or other error that dont leak details to te clients
      //2) send genric message
      return res.status(500).json({
        status: 'fail',
        message: 'Something went very wrong ',
      });
    }
  } else {
    //B) RENDERED WEBSITE
    if (!err.isOperational) {
      return res.status(err.statusCode).render('error', {
        title: 'Something went wrong!',
        msg: err.message,
      });
    } else {
      //1) Log error
      console.error('ERROR💥', err);

      //Programming or other error that dont leak details to te clients
      //2) send genric message
      return res.status(err.statusCode).render('error', {
        title: 'Something went wrong!',
        msg: 'Please try again later.',
      });
    }
  }
};

module.exports = (err, req, res, next) => {
  // console.log(err.stack);
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    if (err.name === 'CastError') err = handleCastErrorDB(err);
    if (err.code === 11000) err = handleDuplicateFieldsDB(err);
    if (err.name === 'ValidationError') err = handleValidationErrorDB(err);
    if (err.name === 'JsonWebTokenError') err = handleJWTError();
    if (err.name === 'TokenExpiredError') err = handleTokenExpError();
    sendErrorProd(err, req, res);
  }
};
