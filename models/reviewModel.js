const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      minLength: [3, 'A review must not be more than 50 characters long'],
      required: [true, `Review can't be empty`],
    },

    rating: {
      type: Number,
      min: [1, 'Rating must be between 1 and 5'],
      max: [5, 'Rating must be between 1 and 5'],
    },

    createdAt: { type: Date, default: Date.now() },

    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour'],
    },

    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user.'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

//preventing multiple review from one  user using indexes
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

//parent referencing
reviewSchema.pre(/^find/, function (next) {
  //   this.populate({
  //     path: 'tour',
  //     select: 'name  ',
  //   })
  this.populate({ path: 'user', select: 'name photo' });
  next();
});

//calculating average rating//saving real data to the tours
reviewSchema.statics.calcAverageRatings = async function (tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        numRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);

  // console.log(stats); return the id rating and numrating
  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsAverage: stats[0].avgRating,
      ratingsQuantity: stats[0].numRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsAverage: 4.5, //setting default
      ratingsQuantity: 0,
    });
  }
};

//Document middleware
reviewSchema.post('save', function () {
  //this.tour points to current review this.constructor to the review model
  this.constructor.calcAverageRatings(this.tour);
});

//Query middleware
reviewSchema.pre(/^findOneAnd/, async function (next) {
  //find by id and find one is same getting id from the query itself
  this.r = await this.findOne();
  // console.log(this.r); this.r return a whole review with tour and user id
  next();
});

reviewSchema.post(/^findOneAnd/, async function () {
  //await this.findOne(); doesnot work here,query already executed
  //this.r return a whole review with tour and user id
  await this.r.constructor.calcAverageRatings(this.r.tour);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
