const mongoose = require('mongoose');
const slugify = require('slugify');
// const User = require('./userModel');

// const validator = require('validator');

const tourSchema = new mongoose.Schema(
  {
    //schema type options
    name: {
      type: String,
      required: [true, 'A tour must have a name '],
      unique: true,
      trim: true,
      //validators
      maxlength: [
        40,
        'A tour name must have less than or equal 40 characters ',
      ],
      minlength: [
        10,
        'A tour name must have more than or equal to 10 characters',
      ],
      // validate: [
      //   validator.isAlpha,
      //   'The name should contain only alphabets not any number',
      // ],
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have difficulty'],
      trim: true,
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either:easy,medium or difficult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Ratings must be above 1.0'],
      max: [5, 'Rating must be equal or below to 5.0'],
      set: (val) => (Math.round(val) * 10) / 10, //46.66666 *10 46.6666 /10 47
    },

    ratingsQuantity: { type: Number, default: 0 },
    price: {
      type: Number,
      required: [true, 'A tour must have price'],
    },

    discountPrice: {
      type: Number,
      validate: {
        //THIS ONLY WORKS ON WHILE CREATING NEW DOCUMENT NOT ON UPDATE
        validator: function (val) {
          return val < this.price;
        },
        message: 'Price must be greater than the dicount price ({VALUE})',
      },
    },

    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have summary'],
    },
    description: {
      type: String,
      trim: true,
    },

    imageCover: {
      type: String,
      required: [true, 'A tour must have imageCover'],
    },

    images: [String],

    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },

    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },

    startLocation: {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },

    locations: [
      {
        type: { type: String, default: 'Point', enum: ['Point'] },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],

    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
  },

  { toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

//compound indexes //default name
tourSchema.index({ price: 1, ratingsAverage: -1 }); // 1 for ascending order
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });

//this cant be save in databse
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

//Virtual populate
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});

//DOCUMENT MIDDLEWARE (pre works on.save() and .create())and post after the document is saved or created
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  //if not written next middleware stuck in this func only and not to ext middleware
  next();
});

//Embedding embedding(de-normalize)
// tourSchema.pre('save', async function (next) {
//   const guidesPromises = this.guides.map(async (id) => await User.findById(id));
//   this.guides = await Promise.all(guidesPromises);
//   next();
// });

// tourSchema.post('save', function (doc, next) {});

//QUERY MIDDLEWARE//////////////
tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();

  next();
});

tourSchema.post(/^find/, function (docs, next) {
  console.log(`Query took ${Date.now() - this.start} milsecs `);
  // console.log(docs); //result your are getting
  next();
});

//populating user through child referencing //find is query middleware
tourSchema.pre(/^find/, function (next) {
  this.populate({ path: 'guides', select: '-__v -passwordChangedAt' });
  next();
});

//AGGREGATION MIDDLEWARE
// tourSchema.pre('aggregate', function (next) {
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });

//   console.log(this.pipeline());
//   next();
// });

//creating model
const Tour = mongoose.model('Tour', tourSchema);
module.exports = Tour;

////////////////////////////////////////////////////////////////////////////////////
//'save' below called hook and together called pre save hook
// tourSchema.pre('save', function (next) {
//   console.log('will save the document');
//   next();
// });

// tourSchema.post('save', (doc, next) => {
//   console.log(doc);
//   next();
// });

//For testing purpose
// const testTour = new Tour({
//   name: 'The forest camper',
//   price: 997,
//   // rating: 4.7,
// });

// testTour
//   .save()
//   .then((doc) => {
//     console.log(doc);
//   })
//   .catch((err) => {
//     console.log('ERROR💥', err);
//   });
