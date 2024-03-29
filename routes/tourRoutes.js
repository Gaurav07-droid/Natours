// const fs = require('fs');
const express = require('express');
const tourController = require('../controllers/tourControllers');
const authController = require('../controllers/authController');
const reviewRouter = require('./reviewRoutes');

const router = express.Router();

//Middleware function for checking id
// router.param('id', tourController.checkId);

//POST /tour/256314/reviews     posting reviews for the tour
//GET /tour/256314/reviews      getting reviews for the tour

//mounting routes
router.use('/:tourId/reviews', reviewRouter);

router
  .route('/monthly-data/:year')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.getMonthlyData
  );

router.route('/tour-stats').get(tourController.getTourStats);

router
  .route('/top-5-tours')
  .get(tourController.aliasTopTours, tourController.getAllTours);

router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(authController.protect, tourController.getToursWithin);

router
  .route('/distances/:latlng/unit/:unit')
  .get(authController.protect, tourController.getDistances);

router
  .route('/')
  .get(tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.createTour
  );

router
  .route('/:id')
  .get(authController.protect, tourController.getTour)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.uploadTourImages,
    tourController.resizeTourImages,
    tourController.updateTour
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour
  );

module.exports = router;
