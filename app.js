const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const bookingController = require('./controllers/bookingController');
const viewRouter = require('./routes/viewRoutes');
const compression = require('compression');
const cors = require('cors');

const app = express();

app.enable('trust proxy');
//setting pug
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

//Global MIDDLEWARES
//allow control-allow-oriign-resource-sharing for all request
app.use(cors());
//if frontend is on another side
// app.user(cors(){
//   origin:
// })

app.options('*', cors());
// app.options('/api/v1/tours/:id', cors());

//serving static files
app.use(express.static(path.join(__dirname, 'public')));

//Set security HTTP headers
// app.use(
//   helmet({
//     contentSecurityPolicy: false,
//   })
// );
// app.use(helmet());
// app.use(helmet.contentSecurityPolicy());

//Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

//Limit request per houy from same API
const limiter = rateLimit({
  max: 5000,
  windowMs: 60 * 60 * 1000,
  message: 'Too many request from this IP,Please try again in an hour!',
});

app.use('/api', limiter);

app.post(
  '/webhook-checkout',
  express.raw({ type: 'application/json' }),
  bookingController.webhookCheckout
);

//Body parser reading data from body ito req.body
app.use(express.json({ limit: '10kb' })); //limiting data size
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

//Data sanitiation again Nsql query injection
app.use(mongoSanitize());

//Data sanitization against XSS
app.use(xss());

//Preventing prameter pollution by HPP
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsAverage',
      'ratingsQuantity',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);

app.use(compression());

//Middleware only works if declared before the route hadlers
// test headers
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.cookies);  shows the cookie which are in the browser
  next();
});

//ROUTES
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

//ERROR HANDLING
//middleware for all INVALID ROUTEs
app.all('*', (req, res, next) => {
  next(new AppError(`can't find the ${req.originalUrl} on this server`, 404));
});

//universal error handling middleware(4 arg) expoted in errorController
app.use(globalErrorHandler);

module.exports = app;
