var GoogleSpreadsheet = require('google-spreadsheet');
var async = require('async');

var os = require('os');
var hostname = os.hostname();
var networkInterface = os.networkInterfaces().wlan0[0];
var mac = networkInterface.mac;
var address = networkInterface.address;

function setAuth(step) {
  // see notes below for authentication instructions!
  var creds = require('../config/ikaritw-dev-f0588cfab94d.json');
  // OR, if you cannot save the file locally (like on heroku)
  var creds_json = {
    client_email: 'yourserviceaccountemailhere@google.com',
    private_key: 'your long private key stuff here'
  }

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

function workingAddingRows(step) {
  // Add a single row to the sheet.
  var new_row = {
    Timestamp:(new Date()).getTime(),
    Hostname:hostname,
    Mac:mac,
    Address:address,
    Temperature:Math.floor(Math.random()*100),
    Humidity:Math.floor(Math.random()*100)
  };
  
  //console.log(new_row);
  
  sheet.addRow(new_row, function(err){
    if(err){
      console.error(err);
    }
    step();
  });
}

function workingWithRows(step) {
  // google provides some query options
  sheet.getRows({
    offset: 1,
    limit: 20,
    orderby: 'col2'
  }, function( err, rows ){
    console.log('Read '+rows.length+' rows');

    // the row is an object with keys set by the column headers
    rows[0].colname = 'new val';
    rows[0].save(); // this is async

    // deleting a row
    rows[0].del();  // this is async

    step();
  });
}
  
function workingWithCells(step) {
  sheet.getCells({
    'min-row': 1,
    'max-row': 5,
    'return-empty': true
  }, function(err, cells) {
    var cell = cells[0];
    console.log('Cell R'+cell.row+'C'+cell.col+' = '+cells.value);

    // cells have a value, numericValue, and formula
    cell.value == '1'
    cell.numericValue == 1;
    cell.formula == '=ROW()';

    // updating `value` is "smart" and generally handles things for you
    cell.value = 123;
    cell.value = '=A1+B2'
    cell.save(); //async

    // bulk updates make it easy to update many cells at once
    cells[0].value = 1;
    cells[1].value = 2;
    cells[2].formula = '=A1+B1';
    sheet.bulkUpdateCells(cells); //async

    step();
  });
}
  
function managingSheets(step) {
  doc.addWorksheet({
    title: 'my new sheet'
  }, function(err, sheet) {

    // change a sheet's title
    sheet.setTitle('new title'); //async

    //resize a sheet
    sheet.resize({rowCount: 50, colCount: 20}); //async

    sheet.setHeaderRow(['name', 'age', 'phone']); //async

    // removing a worksheet
    sheet.del(); //async

    step();
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
  workingAddingRows
]);
