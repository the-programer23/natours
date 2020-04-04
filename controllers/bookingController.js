const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
    // 1)Get Currently booked tour
    const tour = await Tour.findById(req.params.tourId)

    // 2) Create checkout session
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        // success_url: `${req.protocol}://${req.get('host')}/my-tours/?tour=${req.params.tourId}&user=${req.user.id}&price=${tour.price}`,
        sucess_url: `${req.protocol}://${req.get('host')}/my-bookings`,
        cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
        customer_email: req.user.email,
        client_reference_id: req.params.tourId,
        //information about the product that the client is about to purchase
        line_items: [{
            name: `Tour ${tour.name}`,
            description: tour.summary,
            images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
            //this in in cents if price is 1 dolar then it is equals to 100 cents
            amount: tour.price * 100,
            currency: 'usd',
            quantity: 1
        }]
    })
    // 3) Create session as response
    res.status(200).json({
        status: 'success',
        session
    })

});

// exports.createBookingCheckout = catchAsync(async (req, res, next) => {
//     const {
//         tour,
//         user,
//         price
//     } = req.query;

//     if (!tour && !user && !price) return next();

//     await Booking.create({
//         tour,
//         user,
//         price
//     });
//     res.redirect(req.originalUrl.split('?')[0]);
// });

const createBookingCheckout = async (session) => {
    const tour = session.client_reference_id
    // here we grab only the user Id
    const user = await (User.findOne({
        email: session.customer_email
    })).id;
    const price = session.line_items[0].amount / 100;

    await Booking.create({
        tour,
        user,
        price
    })
}

exports.webhookCheckout = (req, res, next) => {
    const signature = req.headers['stripe-signature'];
    let event;

    try {

        event = stripe.webhooks.constructEvent(
            req.body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        return res.status(400).send(`Webhook error: ${err.message}`)
    }

    if (event.type === 'checkout.session.complete')
        createBookingCheckout(event.data.object)

    res.status(200).json({
        received: true
    })
};

exports.createBooking = factory.createOne(Booking);
exports.getAllBookings = factory.getAll(Booking);
exports.getBooking = factory.getOne(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);