var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

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
var routes = require('./routes/index');
app.use('/', routes);


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


module.exports = app;

/*
 * Add Google Spreadsheet Log
 */

var GoogleSpreadsheet = require('google-spreadsheet');
var async = require('async');
var os = require('os');
var hostname = os.hostname();
var networkInterface = os.networkInterfaces().wlan0[0];
var mac = networkInterface.mac;
var address = networkInterface.address;

//https://docs.google.com/spreadsheets/d/1TuN9UybupLKkY_z-R0u_11Gw-qrdfL15_I8ucg3GF4c/edit?usp=sharing
// spreadsheet key is the long id in the sheets URL
var doc = new GoogleSpreadsheet('1TuN9UybupLKkY_z-R0u_11Gw-qrdfL15_I8ucg3GF4c');
var sheet;
async.series([
  function setAuth(step) {
    // see notes below for authentication instructions!
    var creds = require('./config/ikaritw-dev-f0588cfab94d.json');
    // OR, if you cannot save the file locally (like on heroku)
    var creds_json = {
      client_email: 'yourserviceaccountemailhere@google.com',
      private_key: 'your long private key stuff here'
    }
  
    doc.useServiceAccountAuth(creds, step);
  },
  function getInfoAndWorksheets(step) {
    doc.getInfo(function(err, info) {
      console.log('Loaded doc: '+info.title+' by '+info.author.email);
      sheet = info.worksheets[0];
      worksheet_id = sheet.id;
      console.log('sheet 1: '+ sheet.id + ' ' + sheet.title+' '+sheet.rowCount+'x'+sheet.colCount);
      step();
    });
  }
]);

function workingAddingRows(rawdata) {
  // Add a single row to the sheet.
  if(sheet && rawdata){
    var new_row = {
      Timestamp:(new Date()).getTime(),
      Hostname:hostname,
      Mac:mac,
      Address:address,
      Temperature:rawdata.temperature.toFixed(2),
      Humidity:rawdata.humidity.toFixed(2)
    };
    
    //console.log(new_row);
    
    sheet.addRow(new_row, function(err){
      if(err){
        console.error(err);
      }
    });
  }
}


/*
 * 初始化感測器
 */
var sensorLib = require('node-dht-sensor');
var readout = null;
var sensor = {
  initialize: function() {
    return sensorLib.initialize(11, 2);
  },
  read: function() {
    readout = sensorLib.read();
    workingAddingRows(readout);
    console.log('Temperature: ' + readout.temperature.toFixed(2) + 'C, ' + 'humidity: ' + readout.humidity.toFixed(2) + '%');
    setTimeout(function() {
      sensor.read();
    }, 5000);
  }
};
if (sensor.initialize()) {
  sensor.read();
} else {
  console.warn('Failed to initialize sensor');
}

var debug = require('debug')('dht11_express_socket:server');
/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;
  debug('Listening on ' + bind);
}

var http = require('http');

/**
 * Get port from environment and store in Express.
 */

var port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

/**
 * Create HTTP server.
 */
var server = http.createServer(app);
/**
 * Listen on provided port, on all network interfaces.
 */
server.on('error', onError);
server.on('listening', onListening);


// Hook Socket.io into Express
var UI_UPDATE_RATE = 5;
var io = require('socket.io').listen(server);
io.on('connection', function(http_socket) {
  console.log("Socket connected");
  // Emits battery stats every UPDATE_RATE seconds
  setInterval(function() {
    http_socket.emit('old_data', {
      livedata: readout
    });
  }, UI_UPDATE_RATE * 1000);
});


server.listen(port);
