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
        }),
        new(winston.transports.File)({
            filename: 'sensor.log'
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
var routes = require('./routes/index');
app.use('/', routes);

var util = require('util');
app.post('/GoogleQuery', function(req, res) {
    var startTimestamp = req.query.startTimestamp;

    if (sheet) {
        if (startTimestamp) {
            var options = {
                limit: (60 / 5) * 60 * 24,
                query: util.format("timestamp > %s ", startTimestamp)
            };

            log.debug(options);

            sheet.getRows(options, function(err, rows) {
                if (err) {
                    log.error(err);
                }

                var dps_temp = [];
                var dps_hum = [];
                if (rows) {
                    log.info('Read ' + rows.length + ' rows');

                    var xVal;
                    for (var i = 0; i < rows.length; i++) {
                        xVal = parseInt(rows[i].timestamp);
                        dps_temp.push({
                            x: xVal,
                            y: parseInt(rows[i].temperature)
                        });

                        dps_hum.push({
                            x: xVal,
                            y: parseInt(rows[i].humidity)
                        });
                    }
                }

                var result = {
                    'dps_temp': dps_temp,
                    'dps_hum': dps_hum
                };
                res.json(result);
            });
        }
        else {
            res.json({
                error: "No startTimestamp"
            });
        }
    }
    else {
        res.json({
            error: "No Sheet"
        });
    }
});

app.get('/GoogleQuery', function(req, res) {
    var result = {
        'title': 'History'
    };
    res.render('history', result);
});

app.post('/WinstonQuery', function(req, res) {

    var hoursAgo = req.body.hoursAgo || req.query.hoursAgo;
    hoursAgo = hoursAgo || "3";

    hoursAgo = parseInt(hoursAgo, 10);

    var options = {
        from: Date.now() - hoursAgo * 60 * 60 * 1000,
        until: Date.now(),
        limit: 60 * 60 * hoursAgo,
        start: 0,
        order: 'asc',
        fields: ['timestamp', 'humidity', 'temperature']
    };

    //
    // Find items logged between today and yesterday.
    //
    log.query(options, function(err, results) {
        if (err) {
            throw err;
        }
        res.json(results);
    });
});
app.get('/WinstonQuery', function(req, res) {
    var result = {
        'title': 'WinstonQuery'
    };
    res.render('WinstonQuery', result);
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
            log.info('Loaded doc: ' + info.title + ' by ' + info.author.email);
            sheet = info.worksheets[0];
            worksheet_id = sheet.id;
            log.info('sheet 1: ' + sheet.id + ' ' + sheet.title + ' ' + sheet.rowCount + 'x' + sheet.colCount);
            step();
        });
    }
]);

function workingAddingRows(rawdata) {
    // Add a single row to the sheet.
    if (sheet && rawdata) {
        var new_row = {
            Timestamp: (new Date()).getTime(),
            Hostname: hostname,
            Mac: mac,
            Address: address,
            Temperature: rawdata.temperature,
            Humidity: rawdata.humidity
        };

        //log.debug(new_row);

        sheet.addRow(new_row, function(err) {
            if (err) {
                log.error(err);
            }
        });
    }
}


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
        log.info('DHT11', readout);

        //Log to Google Sheet
        //workingAddingRows(readout);

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
            log.error(bind + ' requires elevated privileges');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            log.error(bind + ' is already in use');
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
    log.info('Listening on ' + bind);
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
var UI_UPDATE_RATE = 60;
var io = require('socket.io').listen(server);
io.on('connection', function(http_socket) {
    log.info("Socket connected");
    // Emits battery stats every UPDATE_RATE seconds
    setInterval(function() {
        http_socket.emit('old_data', {
            livedata: readout
        });
    }, UI_UPDATE_RATE * 1000);
});


server.listen(port);
log.info("Here we go!!");
