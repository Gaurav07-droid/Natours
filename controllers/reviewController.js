const Review = require('../models/reviewModel');
const factory = require('./controllerFactory');
const Booking = require('../models/bookingModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.setUserTourIds = (req, res, next) => {
  //Allow nested routes
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id; //coming from protect req.user.id
  next();
};

exports.checkTourBooked = catchAsync(async (req, res, next) => {
  const currentTour = req.params.tourId;
  const currentUser = req.user.id;
  console.log(currentTour, currentUser);
  // const tourBooked = await Booking.find({ tour: currentTour });
  if (
    !(await Booking.findOne({ tour: currentTour })) ||
    !(await Booking.findOne({ user: currentUser }))
  )
    return next(
      new AppError('Sorry!you can only review a tour that you have booked', 401)
    );

  next();
});

exports.getAllReviews = factory.getAll(Review);
exports.getReview = factory.getOne(Review);

exports.createReviewTour = factory.createOne(Review);
exports.deleteReview = factory.deleteOne(Review);
exports.updateReview = factory.updateOne(Review);
