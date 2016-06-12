var os = require('os');
var hostname = os.hostname();

var express = require('express');
var router = express.Router();

/* GET googlequery listing. */

var sheet = null;

/*
 * Add Google Spreadsheet Log
 */
/*
var GoogleSpreadsheet = require('google-spreadsheet');
var async = require('async');
//https://docs.google.com/spreadsheets/d/1TuN9UybupLKkY_z-R0u_11Gw-qrdfL15_I8ucg3GF4c/edit?usp=sharing
// spreadsheet key is the long id in the sheets URL
var doc = new GoogleSpreadsheet('1TuN9UybupLKkY_z-R0u_11Gw-qrdfL15_I8ucg3GF4c');

async.series([
    function setAuth(step) {
        // see notes below for authentication instructions!
        var creds = require('../config/ikaritw-dev-f0588cfab94d.json');
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


*/

router.post('/', function(req, res) {
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

router.get('/', function(req, res) {
  var result = {
    'title': 'History'
  };
  res.render('history', result);
});

function workingAddingRows(rawdata) {
  // Add a single row to the sheet.
  if (sheet && rawdata) {
    var now = new Date();
    var new_row = {
      Timestamp: now.getTime(),
      TImestampJSON:now.toJSON(),
      Hostname: hostname,
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
router.workingAddingRows = workingAddingRows;

module.exports = router;
