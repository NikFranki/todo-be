const createError = require('http-errors');
const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');
const session = require('express-session');

dotenv.config();

const notfound = require('./lib/middleware/notfound');
const error = require('./lib/middleware/error');

const rmUnusedImages = require('./lib/middleware/rm_unused_images');

const authVerify = require('./lib/middleware/authVerify');

const todoRouter = require('./routes/todo');
const subtaskRouter = require('./routes/subtask');
const userRouter = require('./routes/user');
const emailRouter = require('./routes/email');
const listRouter = require('./routes/list');
const tokenValidateRouter = require('./routes/token-validate');

const app = express();

app.set('serverPath', 'http://localhost:8000/images/');
app.set('imagesPath', path.join(__dirname, '/public/images/'));
app.set('xlsxsPath', path.join(__dirname, '/storage/inputs/xlsxs/'));

app.use(session({
  secret: "keyboard cat",
  resave: false,
  saveUninitialized: true,
  cookie: {
    maxAge: 365 * 24 * 60 * 60 * 1000,
    secure: false,
    httpOnly: true,
    sameSite: 'strict',
  },
  rolling: true,
}));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
const allowedOrigins = ['http://localhost:3366', 'http://franki.com', 'http://franki.com:3366'];
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

// rm unused images in public folder
app.use(rmUnusedImages);

// auth verrify
const WHITELIST_URLs = [
  '/jwt/tokenValidate',
  '/user/register',
  '/user/login',
  '/user/logout',
];
app.use('*', (req, res, next) => {
  if (WHITELIST_URLs.includes(req.originalUrl)) {
    next();
  } else {
    authVerify.validateToken(req, res, next);
  }
});

app.use('/todo', todoRouter);
app.use('/subtask', subtaskRouter);
app.use('/user', userRouter);
app.use('/email', emailRouter);
app.use('/list', listRouter);
app.use('/jwt', tokenValidateRouter);

app.use(notfound);
app.use(error);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.send('error');
});

module.exports = app;
