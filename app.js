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

var readout = {};
app.get('/sensor', function(req, res) {
  //"humidity":41,"temperature":30,"isValid":true,"errors":0,"cputemp":30
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


var mqtt = require("mqtt");

var config = require("./config/config.json");

/*Ubidots*/
function Ubidots(deviceName, token) {
  var __deviceName = deviceName;
  var __token = token;
  var __pushURL = "/v1.6/devices/" + __deviceName;

  var mqttClient = mqtt.connect('mqtt://things.ubidots.com', {
    username: __token,
    password: ""
  });

  return {
    "write": function(data) {
      var json = {
        "cpu_temperature": data.cputemp,
        "dht11_temperature": data.temperature,
        "dht11_humidity": data.humidity
      };
      mqttClient.publish(__pushURL, JSON.stringify(json), function(err, res) {
        //console.log("publish done:" + json);
        if (err) {
          console.error(err);
        }
        if (res) {
          console.log(res);
        }
      });
    }
  };

}
var ubidots = new Ubidots("raspberry", config.ubidots.token);

/*
 * 初始化感測器 DHT11
 */
var dht = require('node-dht-sensor');
var raspi = require('node-raspi');

function DHT11(deviceType, gpio, interval,callback) {
  var __initialize = dht.initialize(deviceType, gpio);

  var __dht11 = {
    "initialize": function() {
      return __initialize;
    },
    "read": function() {
      //humidity and temperature
      var dhtread = dht.read();

      // CPU tempetature
      dhtread.cputemp = raspi.getThrm();

      //Log to locale file
      if (dhtread.errors === 0) {
        //sensorLog.info('DHT11', dhtread);

        //Log to Google Sheet
        //googlequery.workingAddingRows(dhtread);

        if (callback) {
          callback(dhtread); //"humidity":41,"temperature":30,"isValid":true,"errors":0,"cputemp":30
        }
      }
    }
  };
  return __dht11;
}

var sensorInterval = 60 * 5; //five minutes
sensorInterval = 2;// 2 seconds

var logData = function(dhtread){
  log.info(dhtread);
  ubidots.write(dhtread);
  readout = dhtread;
};

var dht11 = new DHT11(11, 2, sensorInterval,logData);
var isInitialed = dht11.initialize();

var __initInterval = setInterval(function(){
  log.info('DHT11 initailed:' + isInitialed );
  if (isInitialed) {
    clearInterval(__initInterval);
    setInterval(dht11.read, sensorInterval * 1000);
    log.info("Set interval read for seconds:" + sensorInterval);
  } else {
    log.warn('Failed to initialize sensor');
    isInitialed = dht11.initialize();
  }
}, 1000);
