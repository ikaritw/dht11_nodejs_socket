var winston = require('winston');
var path = require('path');
var sensorLog = new(winston.Logger)({
  level: 'info',
  transports: [
    new(winston.transports.File)({
      filename: path.join(__dirname, 'logs/sensor.log')
    })
  ]
});

var hoursAgo = 48
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
sensorLog.query(options, function(err, results) {
  if (err) {
    throw err;
  }
  console.log(results);
  console.log("results.length:" + results.file.length);
});