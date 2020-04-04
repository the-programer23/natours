const mongoose = require('mongoose');
const slugify = require('slugify');
// const validator = require('validator');
// const User = require('./userModel');

const tourSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'El tour debe tener un nombre'],
    unique: true,
    trim: true,
    maxlength: [60, 'El nombre del tour debe tener menos de 60 caracteres'],
    minlength: [10, 'El nombre del tour debe tener más de 10 caracteres']
    //validate: [validator.isAlpha, 'El nombre del tour solo debe tener letras']
  },
  slug: String,
  duration: {
    type: Number,
    required: [true, 'El tour debe tener una duración']
  },
  maxGroupSize: {
    type: Number,
    required: [true, 'El tour debe tener un tamaño máximo del grupo']
  },
  difficulty: {
    type: String,
    required: [true, 'El tour debe tener un nivel de dificultad'],
    enum: {
      values: ['fácil', 'medio', 'difícil'],
      message: 'El nivel de dificultad puede ser: fácil, medio, difícil'
    }
  },
  ratingsAverage: {
    type: Number,
    default: 4.5,
    min: [1, 'Las calificaciones deben estar por encima de 1.0'],
    max: [5, 'Las calificaciones deben estar por debajo de 5.0'],
    set: val => Math.round(val * 10) / 10 // Math.round(4.666666 * 10) = 47 / 10 = 4.7
  },
  ratingsQuantity: {
    type: Number,
    default: 0
  },
  price: {
    type: Number,
    required: [true, 'El tour debe tener un precio']
  },
  priceDiscount: {
    type: Number,
    validate: {
      validator: function (val) {
        //This only points to current doc on New document creation
        return val < this.price;
      },
      message: 'El precio de descuento ({VALUE}) debe ser inferior el precio publicado'
    }
  },
  summary: {
    type: String,
    trim: true,
    required: [true, 'El tour debe tener una descripción']
  },
  description: {
    type: String,
    trim: true
  },
  imageCover: {
    type: String,
    required: [true, 'El tour debe tener una imagen de cubierta']
  },
  images: [String],
  createdAt: {
    type: Date,
    default: Date.now(),
    select: false
  },
  startDates: [Date],
  secretTour: {
    type: Boolean,
    default: false
  },
  startLocation: {
    // GeoJson
    type: {
      type: String,
      default: 'Point',
      enum: ['Point']
    },
    coordinates: [Number],
    address: String,
    description: String
  },
  locations: [{
    type: {
      type: String,
      default: 'Point',
      enum: ['Point']
    },
    coordinates: [Number],
    address: String,
    description: String,
    day: Number
  }],
  guides: [{
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }]
}, {
  toJSON: {
    virtuals: true
  },
  toObject: {
    virtuals: true
  }
});

tourSchema.index({
  price: 1,
  ratingsAverage: -1
})
tourSchema.index({
  slug: 1
})
tourSchema.index({
  startLocation: '2dsphere'
})

tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

// Virtual Populate
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id'
});

//DOCUMENT MIDDLEWARE, runs before .save() and .create()
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, {
    lower: true
  });
  next();
});

//QUERY MIDDLEWARE
tourSchema.pre(/^find/, function (next) {
  this.find({
    secretTour: {
      $ne: true
    }
  });
  this.start = Date.now();
  next();
});

tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt'
  });
  next()
})

// tourSchema.post(/^find/, function (docs, next) {
//   console.log(`Query took ${Date.now() - this.start} Milliseconds `);
//   next();
// });

// AGGREGATION MIDDLEWARE
// tourSchema.pre('aggregate', function (next) {
//   console.log("this.pipeline", this.pipeline());
//   const obj = this.pipeline().unshift({
//     $match: {
//       secretTour: {
//         $ne: true
//       }
//     }
//   });
//   console.log(obj);
//   next();
// });

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;