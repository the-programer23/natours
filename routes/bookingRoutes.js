const authController = require('./../controllers/authController');
const express = require('express');
const bookingController = require('./../controllers/bookingController');

const router = express.Router();

router.use(authController.protect)

router.get('/checkout-session/:tourId', bookingController.getCheckoutSession);



//this is for the admin and the lead-guide
router.use(authController.restrictTo('admin', 'lead-guide'))

router.route('/')
    .get(bookingController.getAllBookings)
    .post(bookingController.createBooking);

router.route('/:id')
    .get(bookingController.getBooking)
    .patch(bookingController.updateBooking)
    .delete(bookingController.deleteBooking)


module.exports = router;