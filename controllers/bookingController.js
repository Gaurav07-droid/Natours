const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const catchAsync = require('../utils/catchAsync');
const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const Booking = require('../models/bookingModel');
const controllerFactory = require('../controllers/controllerFactory');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  //get currently booked tour
  const tour = await Tour.findById(req.params.tourId);

  //create checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    // success_url: `${req.protocol}://${req.get('host')}/?tour=${
    //   req.params.tourId
    // }&user=${req.user.id}&price=${tour.price}`,
    success_url: `${req.protocol}://${req.get('host')}/`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    line_items: [
      {
        name: `${tour.name} Tour`,
        description: tour.summary,
        images: [
          `${req.protocol}://${req.get('host')}/img/tours/${tour.imageCover}`,
        ],
        amount: tour.price * 100,
        currency: 'usd',
        quantity: 1,
      },
    ],
  });

  //create session as response
  res.status(200).json({
    status: 'success',
    session,
  });
});

// exports.createBookingCheckout = catchAsync(async (req, res, next) => {
//   //this is insecure and it is temperory everyone can book without even paying

//   const { tour, user, price } = req.query;

//   if (!tour && !user && !price) return next();

//   await Booking.create({ tour, user, price });

//   res.redirect(req.originalUrl.split('?')[0]);

//   next();
// });

const createBookingDatabase = async (session) => {
  const tour = session.client_reference_id;
  const user = (await User.findOne({ email: session.customer_email })).id;
  const price = session.amount_total / 100;

  await Booking.create({ tour, user, price });
};

exports.webhookCheckout = (req, res, next) => {
  const signature = req.headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`webhook error:${err.message}`);
  }

  if (event.type === 'checkout.session.completed')
    createBookingDatabase(event.data.object);

  res.status(200).json({ received: true });
};

exports.createBooking = controllerFactory.createOne(Booking);
exports.getBooking = controllerFactory.getOne(Booking);

exports.getAllBookings = controllerFactory.getAll(Booking);
exports.updateBooking = controllerFactory.updateOne(Booking);
exports.deleteBooking = controllerFactory.deleteOne(Booking);
