const mongoose = require('mongoose')

const bookingSchema = new mongoose.Schema({
    tour: {
        type: mongoose.Schema.ObjectId,
        ref: 'Tour',
        required: [true, 'Es necesario que tu reserva haga parte de un tour'],
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'Es necesario que tu reserva este vinculada a un usuario']
    },
    price: {
        type: Number,
        required: [true, 'La reserva debe tener un precio']
    },
    createdAt: {
        type: Date,
        default: Date.now()
    },
    paid: {
        type: Boolean,
        default: true
    }
});

bookingSchema.pre(/^find/, function (next) {
    this.populate('user').populate({
        path: 'tour',
        select: 'name'
    });
    next()
});

const Booking = mongoose.model('booking', bookingSchema);

module.exports = Booking;