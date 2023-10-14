const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');
const session = require('express-session');

const notfound = require('./lib/middleware/notfound');
const error = require('./lib/middleware/error');

const rmUnusedImages = require('./lib/middleware/rm_unused_images');

const entriesRouter = require('./routes/entries');
const userRouter = require('./routes/user');
const emailRouter = require('./routes/email');
const foldersRouter = require('./routes/folders');

const app = express();

app.set('serverPath', 'http://localhost:8000/images/');
app.set('imagesPath', path.join(__dirname, '/public/images/'));
app.set('xlsxsPath', path.join(__dirname, '/storage/inputs/xlsxs/'));

app.use(session({
  secret: "keyboard cat",
  resave: false,
  saveUninitialized: true,
  cookie: {
    maxAge: 1000 * 60 * 60 * 1, // 1 小时过期
  },
  rolling: true,
}));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:8080', 'http://franki.sevenyuan.cn'],
  credentials: true,
}));

// rm unused images in public folder
app.use(rmUnusedImages);

app.use('/', entriesRouter);
app.use('/user', userRouter);
app.use('/email', emailRouter);
app.use('/folders', foldersRouter);

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
  res.render('error');
});

module.exports = app;
