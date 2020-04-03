const AppError = require('./../utils/appError');

const handleExpiredTokenError = () => {
    return new AppError('sesión expirada, por favor inicie sesión nuevamente', 401)
}

const handleJWTError = () => {
    return new AppError('Token invalido, por favor inicia sesión de nuevo', 401);
}

const handleCastErrorDB = err => {
    const message = `Invalid ${err.path}: ${err.value}`;
    return new AppError(message, 404);
}

const handleDuplicateFieldsDB = err => {
    const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];

    const message = `Duplicate field value: ${value}. Please use another value`
    return new AppError(message, 400)
}

const handleValidationError = err => {
    const error = Object.values(err.errors).map(el => el.message);
    const message = `Invalid input data. ${error.join('. ')}`
    return new AppError(message, 404)
}

const sendErrorDev = (err, req, res) => {
    // Api
    if (req.originalUrl.startsWith('/api')) {
        return res.status(err.statusCode).json({
            status: err.status,
            error: err,
            stack: err.stack,
            message: err.message
        });
    }
    // Rendered website
    console.log('Error', err)
    return res.status(err.statusCode).render('error', {
        title: 'Algo salio mal',
        msg: err.message
    });

};

const sendErrorProd = (err, req, res) => {
    // A) API
    if (req.originalUrl.startsWith('/api')) {
        //Operational, trusted error: send message to client
        if (err.isOperational) {
            return res.status(err.statusCode).json({
                status: err.status,
                message: err.message
            });
            //Programming or other unkown error: don't leak error details
        }
        //Log Error 
        console.error('Error', err)
        //Send generic message
        return res.status(500).json({
            status: 'error',
            message: 'Por favor intenta de nuevo después'
        });
    };

    // B) RENDERED WEBSITE
    if (err.isOperational) {
        //Operational, trusted error: send message to client
        return res.status(err.statusCode).render('error', {
            title: 'Algo salio mal',
            msg: err.message
        })
        //Programming or other unkown error: don't leak error details
    }
    //Log Error 
    console.error('Error', err)
    //Send generic message
    return res.status(err.statusCode).render('error', {
        title: 'Algo salio mal',
        msg: 'Por favor intenta de nuevo después'
    });

};




module.exports = (err, req, res, next) => {

    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err, req, res)
    } else if (process.env.NODE_ENV === 'production') {
        let error = {
            ...err
        }
        error.message = err.message

        if (error.name === 'CastError') {
            error = handleCastErrorDB(error);
        }

        if (error.code === 11000) {
            error = handleDuplicateFieldsDB(error);
        }

        if (error.name === "ValidationError") {
            error = handleValidationError(error);
        }

        if (error.name === "JsonWebTokenError") {
            error = handleJWTError()
        }

        if (error.name === "TokenExpiredError") {
            error = handleExpiredTokenError()
        }

        sendErrorProd(error, req, res);
    }

}