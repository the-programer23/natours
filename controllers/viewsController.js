const User = require('../models/userModel');
const Booking = require('../models/bookingModel')
const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.alerts = (req, res, next) => {
    const {
        alert
    } = req.query
    console.log(alert)

    if (alert === 'booking') {
        res.locals.alert = "Su reserva fue exitosa, por favor verifica tu email para confirmarlo. Si su reserva no apararece aquí inmediatamente, por favor refresca esta página en unos instantes"
    }
    next();
}

exports.getOverview = catchAsync(async (req, res, next) => {
    // 1) Get Tours data from collection
    const tours = await Tour.find()
    // 2) Build template

    // 3) Render that template using the tour data

    res.status(200).render('overview', {
        title: 'Todos los Tours',
        tours
    })
});

exports.getTour = catchAsync(async (req, res, next) => {
    const tour = await Tour.findOne({
        slug: req.params.tourSlug
    }).populate({
        path: 'reviews',
        fields: 'user rating review'
    })

    if (!tour) {
        return next(new AppError('No hay un tour con ese nombre', 404));
    }

    res.status(200).render('tour', {
        title: `${tour.name}`,
        tour
    })
});

exports.getMyTours = catchAsync(async (req, res, next) => {
    const bookings = await Booking.find({
        user: req.user.id
    })

    const tourIds = bookings.map(el => el.tour)
    console.log(tourIds)
    const tours = await Tour.find({
        _id: {
            $in: tourIds
        }
    })

    res.status(200).render('overview', {
        title: 'Mis Tours Reservados',
        tours
    })
});

exports.getLoginForm = (req, res) => {

    res.status(200).render('login', {
        title: 'Ingresa a tu Cuenta'
    })
};

exports.getAccount = (req, res) => {
    res.status(200).render('account', {
        title: 'Tu cuenta'
    })
}

exports.updateUserData = catchAsync(async (req, res, next) => {
    const updatedUser = await User.findByIdAndUpdate(req.user.id, {
        name: req.body.name,
        email: req.body.email
    }, {
        new: true,
        runValidators: true
    })

    res.status(200).render('account', {
        title: 'Tu cuenta',
        user: updatedUser
    })

});