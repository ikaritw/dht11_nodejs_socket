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


var config = require("./config/config.json");
var mqtt = require("mqtt");
var mqttClient = mqtt.connect('mqtt://things.ubidots.com', {
  username: config.ubidots.token,
  password: ""
});
var Ubidots = {
  "write": function(data) {
    var json = JSON.stringify(data);
    mqttClient.publish("/v1.6/devices/raspberry", json, function(err, res) {
      //console.log("publish done:" + json);
      if (err) {
        console.error(err);
      }
      if (res) {
        console.log(res);
      }
    });
  },
  "append_dht11": function(readout) {
    var data = {
      "dht11_humidity": readout.humidity,
      "dht11_temperature": readout.temperature
    };
    Ubidots.write(data);
  },
  "append_cpu_temperature": function(cpu_temperature) {
    var data = {
      "cpu_temperature": cpu_temperature
    };
    Ubidots.write(data);
  }
};


/*
 * 初始化感測器
 */
var sensorLib = require('node-dht-sensor');
var readout = null;
var sensorInterval = 60;
var Sensor = {
  initialize: function() {
    return sensorLib.initialize(11, 2);
  },
  read: function() {
    readout = sensorLib.read();
    //"humidity":41,"temperature":30,"isValid":true,"errors":0

    //Log to locale file
    if (readout.errors === 0) {
      sensorLog.info('DHT11', readout);

      //Log to Google Sheet
      //googlequery.workingAddingRows(readout);

      // Log to ubidots
      Ubidots.append_dht11(readout);
    }
    setTimeout(function() {
      Sensor.read();
    }, sensorInterval * 1000);
  }
};
if (Sensor.initialize()) {
  Sensor.read();
}
else {
  log.warn('Failed to initialize sensor');
}


// CPU tempetature
var exec = require('child_process').exec;
var child;
var cpu_tempe;

setInterval(function() {
  child = exec("/bin/cat /sys/class/thermal/thermal_zone0/temp", function(error, stdout, stderr) {
    if (error) {
      log.error('exec error: ' + error);
    }
    else {
      cpu_tempe = parseInt(stdout, 10) / 1000;
      Ubidots.append_cpu_temperature(cpu_tempe);
      //sensorLog.info('cpu_tempe', cpu_tempe);
      //console.log(new Date().toJSON() + ":" + cpu_tempe);
    }
  });
}, sensorInterval * 1000);