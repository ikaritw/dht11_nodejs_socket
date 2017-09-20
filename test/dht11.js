var raspi = require('node-raspi');
var cputemp = raspi.getThrm();
console.log('cputemp: ' + cputemp.toFixed(2) + '°C');

var dht = require('node-dht-sensor');
dht.initialize(11, 2);
var dhtread = dht.read();
console.log('temp: ' + dhtread.temperature.toFixed(2) + '°C');
console.log('humidity: ' + dhtread.humidity.toFixed(2) + '%');