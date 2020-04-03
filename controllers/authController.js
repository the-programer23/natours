const crypto = require('crypto');
const {
  promisify
} = require('util');
const User = require('./../models/userModel');
const AppError = require('./../utils/appError');
const catchASync = require('./../utils/catchAsync');
const Email = require('./../utils/mail');

const jwt = require('jsonwebtoken');

const signToken = id => {
  return jwt.sign({
      id: id
    },
    process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN
    }
  );
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };
  if (process.env.NODE_ENV === 'production') {
    cookieOptions.secure = true;
  }
  res.cookie('jwt', token, cookieOptions);

  //Remove the user password from the output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user
    }
  });
};

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedOut', {
    expires: new Date(Date.now()),
    httpOnly: true
  });
  res.status('200').json({
    status: 'success'
  })
};

exports.signup = catchASync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    role: req.body.role
  });
  const url = `${req.protocol}://${req.get('host')}/me`
  console.log(url)
  await new Email(newUser, url).sendWelcome()
  createSendToken(newUser, 201, res);
});

// This function renders pages only, it's not for errors
exports.isLoggedIn = async (req, res, next) => {
  try {
    if (req.cookies.jwt) {
      // 1) Verify Token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET,
      );

      // 2) Check if user still exists
      const currentUser = await User.findById(decoded.id);

      if (!currentUser) {
        return next();
      }
      // 3) Check if user changed password after the token was issued
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      //There is a logged in user
      //With this code the .pug files will have access to the user data
      res.locals.user = currentUser;
      return next();
    }
  } catch (err) {
    return next()
  }
  next();
};

exports.login = catchASync(async (req, res, next) => {

  const {
    email,
    password
  } = req.body;

  if (!email || !password) {
    return next(
      new AppError('Por favor ingresa un email y una contraseña'),
      400
    );
  }

  const user = await User.findOne({
    email
  }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Email o contraseña invalido', 401));
  }
  createSendToken(user, 200, res);
});

exports.protect = catchASync(async (req, res, next) => {
  // 1. Get the token and check if it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError(
        'No has iniciado sesión. Inicia sesión para obtener acceso',
        401
      )
    );
  }
  // 2. Verification Token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  // 3. Check if user still exists
  const currentUser = await User.findById(decoded.id);

  if (!currentUser) {
    return next(new AppError('Este usuario ya no existe', 401));
  }
  // 4. Check if user changed password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError(
        'Su contraseña fue cambiada recientemente, por favor intenta de nuevo',
        401
      )
    );
  }

  //Grant acces to protected route
  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    //roles=['admin', 'lead-guide']
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('No tienes permiso para realizar esta acción', 403)
      );
    }
    next();
  };
};

exports.forgotPassword = catchASync(async (req, res, next) => {
  //1. Get user based on POSTed email
  const user = await User.findOne({
    email: req.body.email
  });
  if (!user) {
    return next(new AppError('No hay un usuario con ese email', 404));
  }
  //2. Generate the random reset Token
  const resetToken = user.createPasswordResetToken();
  await user.save({
    validateBeforeSave: false
  });

  // 3) Send URL token to the user's email
  try {
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;

    await new Email(user, resetURL).sendPassworReset();

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email'
    });
  } catch {
    (user.passwordResetToken = undefined),
    (user.passwordResetExpires = undefined);
    await user.save({
      validateBeforeSave: false
    });

    return next(
      new AppError(
        'Hubo un error al enviar el correo electrónico. Por favor, inténtelo de nuevo más tarde'
      ),
      500
    );
  }
});

exports.resetPassword = catchASync(async (req, res, next) => {
  //1) Get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: {
      $gt: Date.now()
    }
  });
  //2) If the token has not expired and there is a new, set a new password
  if (!user) {
    return next(new AppError('El token es invalido o ha expirado', 400));
  }
  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save();
  //3) Update passwordChangedAt property for the user with the new

  //4) Log User in, send JWT
  createSendToken(user, 200, res);
});

exports.updatePassword = catchASync(async (req, res, next) => {
  //1)Get user from collection
  console.log(req.user, ' & ', req.user._id);
  const user = await User.findById(req.user._id).select('+password');

  //2)Check if POSTed current password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Contraseña incorrecta', 401));
  }

  //3)If so, update password
  user.password = req.body.password;
  user.confirmPassword = req.body.passwordConfirm;

  await user.save();
  //4)Log user in, send jwt
  createSendToken(user, 200, res);
});