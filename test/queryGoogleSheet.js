var GoogleSpreadsheet = require('google-spreadsheet');
var async = require('async');

function setAuth(step) {
  // see notes below for authentication instructions!
  var creds = require('../config/ikaritw-dev-f0588cfab94d.json');

  doc.useServiceAccountAuth(creds, step);
}

function getInfoAndWorksheets(step) {
  doc.getInfo(function(err, info) {
    console.log('Loaded doc: '+info.title+' by '+info.author.email);
    sheet = info.worksheets[0];
    worksheet_id = sheet.id;
    console.log('sheet 1: '+ sheet.id + ' ' + sheet.title+' '+sheet.rowCount+'x'+sheet.colCount);
    step();
  });
}

function workingWithRows(step) {
  // google provides some query options
  var options = {
    limit: 20,
    query: 'timestamp > 1463328000000'
  };
  sheet.getRows(options, function( err, rows ){
    if(err){
      console.error(err);
    }
    
    if(rows){
      console.log('Read '+rows.length+' rows');
      console.log(rows[0]);
      console.log(rows[0].timestamp);
    }
    step();
  });
}

//https://docs.google.com/spreadsheets/d/1TuN9UybupLKkY_z-R0u_11Gw-qrdfL15_I8ucg3GF4c/edit?usp=sharing
// spreadsheet key is the long id in the sheets URL
var doc = new GoogleSpreadsheet('1TuN9UybupLKkY_z-R0u_11Gw-qrdfL15_I8ucg3GF4c');
var sheet;

async.series([
  setAuth,
  getInfoAndWorksheets,
  workingWithRows
]);
