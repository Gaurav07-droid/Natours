const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Email = require('../utils/email');
// const { use } = require('../routes/userRoutes');

const signToken = function (id) {
  //for {id:id} we use {id}
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = function (user, statusCode, req, res) {
  const token = signToken(user._id);

  //sending cookie to the browser
  res.cookie('jwt', token, {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN + 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: req.secure || req.header['x-forwarded-proto'] === 'https',
  });

  //removing password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
    role: req.body.role,
    active: req.body.active,
  });
  const url = `${req.protocol}://${req.get('host')}/me`;

  await new Email(newUser, url).sendWelcome();

  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  //check if email and password  exist
  if (!email || !password) {
    return next(new AppError('email and password required!', 400));
  }

  //check if user exist or password is correct
  const user = await User.findOne({ email }).select('+password');
  // const correct = await user.correctPassword(password, user.password);
  //correct password is from userMODEL on SCHEMA
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Invalid email or password', 401));
  }
  //if everyThing is okay send token to the user
  createSendToken(user, 200, req, res);
  // const token = signToken(user._id);
  // res.status(200).json({ status: 'success', token });
});

exports.protect = catchAsync(async (req, res, next) => {
  let token;
  //Getting token and verifying wheteher it is there or not
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  if (!token) {
    // console.log(token);
    return next(
      new AppError('you are not logged in!please login to get access.', 401)
    );
  }
  //verification token (util.pomisify)
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  // console.log(decoded);

  //check if its user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(new AppError('This user is no longer exists.!', 401));
  }

  //check if user changed password after JWT token was issued
  if (currentUser.ChangedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('Password changed by the user!Please login again.', 401)
    );
  }
  //GRANT ACCESS TO PROTECTED ROUTES
  req.user = currentUser;
  res.locals.user = currentUser;

  next();
});

exports.isLoggedIn = async (req, res, next) => {
  try {
    //checking cookie in the browser
    if (req.cookies.jwt) {
      //verification token (util.pomisify)
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );
      // console.log(decoded);

      //check if its user still exists
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }
      //check if user changed password after JWT token was issued
      if (currentUser.ChangedPasswordAfter(decoded.iat)) {
        return next();
      }

      //THERE IS A LOGGED IN USER
      res.locals.user = currentUser;
      return next();
    }
  } catch (err) {
    return next();
  }
  next();
};

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  //check if email and password  exist
  if (!email || !password) {
    return next(new AppError('Email and password required!', 400));
  }

  //check if user exist or password is correct
  const user = await User.findOne({ email }).select('+password');
  // const correct = await user.correctPassword(password, user.password);
  //correct password is from userMODEL on SCHEMA
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Invalid email or password', 401));
  }
  //if everyThing is okay send token to the user
  createSendToken(user, 200, req, res);
  // const token = signToken(user._id);
  // res.status(200).json({ status: 'success', token });
});

exports.logout = (req, res) => {
  //sending fake token
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({
    status: 'success',
  });
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    //roles ['admin','lead-guide'] role='user'
    //req.user coming from protet as it runs before this in tourRoutes
    if (!roles.includes(req.user.role)) {
      next(new AppError('Oops!you are not allowed to access this route!', 403));
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  //get user based on POSTED email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('No user found with this email', 404));
  }

  //Generate token accoring to the email
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // const message = `Forgot your password!Submit patch request with your new password and confir password  to: ${resetUrl}.\nif not frogotten password please ignore this`;

  try {
    //send it to user's Email (NODE-MAILER)
    const resetUrl = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;

    await new Email(user, resetUrl).sendResetPasswordToken();

    // console.log(email);
    res.status(200).json({
      status: 'success',
      message: 'Token send to email',
    });
  } catch (err) {
    console.log(err);
    user.createPasswordResetToken = undefined;
    user.resetPasswordExpiresIn = undefined;

    await user.save({ validateBeforeSave: false });

    return next(
      new AppError('There was an Error sending email!Try again later', 500)
    );
  }
});

exports.resetPassword = async (req, res, next) => {
  //1)get user based on the token.
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpiresIn: { $gte: Date.now() },
  });
  //2)if token not expired an there is a user,set new password.
  if (!user) {
    return next(new AppError('Token is invalid or expired', 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpiresIn = undefined;
  await user.save();
  //3)update changePassword property for the user.
  //4)log the user in,send jWT.
  createSendToken(user, 200, req, res);
  // const token = signToken(user._id);
  // res.status(200).json({
  //   status: 'success',
  //   token,
  // });
};

exports.updatePassword = catchAsync(async (req, res, next) => {
  //Get user from the collection
  const user = await User.findById(req.user.id).select('+password');

  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(
      new AppError('current password is not correct!try again ', 401)
    );
  }

  //if user exist save password to database
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  //log in user and send jwt
  createSendToken(user, 200, req, res);
});
