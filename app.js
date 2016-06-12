var util = require('util');
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var winston = require('winston');

var log = new(winston.Logger)({
  level: 'debug',
  transports: [
    new(winston.transports.Console)({
      colorize: true,
      timestamp: true
    })
  ]
});

sensorLog = new(winston.Logger)({
  level: 'info',
  transports: [
    new(winston.transports.File)({
      filename: path.join(__dirname, 'logs/sensor.log')
    })
  ]
});

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Routes
var index = require('./routes/index');
app.use('/', index);

var googlequery = require('./routes/googlequery');
app.use('/googlequery', googlequery);

var winstonquery = require('./routes/winstonquery');
app.use('/winstonquery', winstonquery);


app.get('/sensor', function(req, res) {
  if (readout) {
    res.json({
      livedata: readout
    });
  }
  else {
    res.json({
      livedata: null
    });
  }
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

// Hook Socket.io into Express
var UI_UPDATE_RATE = 60;
var io = app.io = require('socket.io')();
//app.io.listen(server);
io.on('connection', function(http_socket) {
  log.info("Socket connected");

  // Emits battery stats every UPDATE_RATE seconds
  setInterval(function() {
    http_socket.emit('old_data', {
      livedata: readout
    });
  }, UI_UPDATE_RATE * 1000);
});


log.info("app.js is ready.");

module.exports = app;


/*
 * 初始化感測器
 */
var sensorLib = require('node-dht-sensor');
var readout = null;
var sensorInterval = 60;
var sensor = {
  initialize: function() {
    return sensorLib.initialize(11, 2);
  },
  read: function() {
    readout = sensorLib.read();

    //Log to locale file
    sensorLog.info('DHT11', readout);

    //Log to Google Sheet
    //googlequery.workingAddingRows(readout);

    setTimeout(function() {
      sensor.read();
    }, sensorInterval * 1000);
  }
};
if (sensor.initialize()) {
  sensor.read();
} else {
  log.warn('Failed to initialize sensor');
}