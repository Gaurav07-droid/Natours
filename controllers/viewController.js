const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const User = require('../models/userModel');
const Booking = require('../models/bookingModel');

exports.alerts = (req, res, next) => {
  const { alert } = req.query;
  if (alert === 'booking ')
    res.locals.alert =
      'Your booking was successful!Please check you email for confirmation.';

  next();
};

exports.getOverview = catchAsync(async (req, res, next) => {
  //1) get data from the tour model
  const tours = await Tour.find();

  //2) create  template (created in views)

  //3) render the data from 1 into templates   //object are called locale variable
  res.status(200).render('overview', {
    title: 'All Tours',
    tours,
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    select: 'rating review user',
  });

  // const booked = await Booking.find({ tour: tour._id, user: req.user.id });

  // if (!tour) {
  //   return next(new AppError('There is no tour with that name.', 404));
  // }

  res.status(200).render('tour', {
    title: tour.name,
    tour,
  });
});

exports.getLoginForm = (req, res, next) => {
  res.status(200).render('login', {
    title: 'Log in to your account',
  });
};

exports.getSigninForm = (req, res, next) => {
  res.status(200).render('signin', {
    title: 'Create new account here',
  });
};

exports.getMe = async (req, res, next) => {
  //after title user coming from protect middleware running before this getMe muiddleware
  res.status(200).render('account', {
    title: 'Your account',
  });
};

exports.getMyTours = catchAsync(async (req, res, next) => {
  //find all the bookings
  const bookings = await Booking.find({ user: req.user.id });

  //find tours with the returned IDs
  const tourIds = bookings.map((el) => el.tour); //return an array of tour IDs
  const tours = await Tour.find({ _id: { $in: tourIds } });

  res.status(200).render('overview', {
    title: 'My Tours',
    tours,
  });
});

exports.updateUserData = async (req, res, next) => {
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    {
      email: req.body.email,
      name: req.body.name,
    },
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).render('account', {
    title: 'Your account',
    user: updatedUser,
  });
};
