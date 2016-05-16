var GoogleSpreadsheet = require('google-spreadsheet');
var async = require('async');
var moment = require('moment');
var util = require('util');

function setAuth(step) {
    // see notes below for authentication instructions!
    var creds = require('../config/ikaritw-dev-f0588cfab94d.json');

    doc.useServiceAccountAuth(creds, step);
}

function getInfoAndWorksheets(step) {
    doc.getInfo(function(err, info) {
        console.log('Loaded doc: ' + info.title + ' by ' + info.author.email);
        sheet = info.worksheets[0];
        worksheet_id = sheet.id;
        console.log('sheet 1: ' + sheet.id + ' ' + sheet.title + ' ' + sheet.rowCount + 'x' + sheet.colCount);
        step();
    });
}

function workingWithRows(step) {
    // google provides some query options
    var start = new Date(moment("2015-05-15 00:00:00").format()).getTime();
    var end = new Date(moment("2015-05-16 00:00:00").format()).getTime();
    var options = {
        limit: 100,
        query: util.format("timestamp > %s ", start)
    };

    console.dir(options);
    sheet.getRows(options, function(err, rows) {
        if (err) {
            console.error(err);
        }

        if (rows) {
            console.log('Read ' + rows.length + ' rows');
            var dps_temp = [];
            var dps_hum = [];

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


            console.dir({
                "dps_temp": dps_temp,
                "dps_hum": dps_hum
            });
        }
    });
}


//https://docs.google.com/spreadsheets/d/1TuN9UybupLKkY_z-R0u_11Gw-qrdfL15_I8ucg3GF4c/edit?usp=sharing
// spreadsheet key is the long id in the sheets URL
var doc = new GoogleSpreadsheet('1TuN9UybupLKkY_z-R0u_11Gw-qrdfL15_I8ucg3GF4c');
var sheet;
var worksheet_id;

async.series([
    setAuth,
    getInfoAndWorksheets,
    workingWithRows
]);