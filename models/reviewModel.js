const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema({
    review: {
        type: 'String',
        required: [true, 'Por favor escribe tu opinión']
    },
    rating: {
        type: Number,
        min: 1,
        max: 5
    },
    createdAt: {
        type: Date,
        default: Date.now()
    },
    tour: [{
        type: mongoose.Schema.ObjectId,
        ref: 'Tour',
        required: [true, 'Tu opinión debe hacer parte de un tour']
    }],
    user: [{
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'El comentario debe provenir de un usuario']
    }]
}, {
    toJSON: {
        virtuals: true
    },
    toObject: {
        virtuals: true
    }
});

// One user can only post 1 review for one tour
reviewSchema.index({
    tour: 1,
    user: 1
}, {
    unique: true
});

reviewSchema.pre(/^find/, function (next) {
    // this.populate({
    //     path: 'tour',
    //     select: 'name'
    // }).populate({
    //     path: 'user',
    //     select: 'name photo'
    // })

    this.populate({
        path: 'user',
        select: 'name photo'
    })

    next();
})

reviewSchema.statics.calcAverageRatings = async function (tourId) {
    const stats = await this.aggregate([{
            $match: {
                tour: tourId
            }
        },
        {
            $group: {
                _id: 'tour',
                nRating: {
                    $sum: 1
                },
                avgRating: {
                    $avg: '$rating'
                }
            }
        }
    ]);

    if (stats.length > 0) {
        await Tour.findByIdAndUpdate(tourId, {
            ratingsAverage: stats[0].avgRating,
            ratingsQuantity: stats[0].nRating
        });
    } else {
        await Tour.findByIdAndUpdate(tourId, {
            ratingsAverage: 0,
            ratingsQuantity: 4.5
        });
    }

};

reviewSchema.pre(/^findOneAnd/, async function (next) {
    this.review = await this.findOne()
    next()
})

reviewSchema.post(/^findOneAnd/, async function () {
    await this.review.constructor.calcAverageRatings(this.review.tour[0])
});

reviewSchema.post('save', function () {
    // 'this' points to the current document about to be saved, this.constructor point to the Model
    this.constructor.calcAverageRatings(this.tour)
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;