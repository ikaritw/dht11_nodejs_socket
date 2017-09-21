var dps_temp = []; // dataPoints
var dps_hum = []; // dataPoints
var dps_cpu = []; // dataPoints
var chart;
var dataLength = (60 / 5) * 60 * 8;

function initCanvasJS(cb) {
  chart = new CanvasJS.Chart("chartContainer", {
    title: {
      text: "Live DHT11 && CPU"
    },
    zoomEnabled: true,
    zoomType: "xy",
    theme: "theme1",
    axisY: {
      title: "Data",
    },
    axisX: {
      title: "Time",
    },
    data: [{
      type: "line",
      name: "Temperature",
      xValueType: "dateTime",
      dataPoints: dps_temp
    }, {
      type: "line",
      name: "Humidity",
      xValueType: "dateTime",
      dataPoints: dps_hum
    }, {
      type: "line",
      name: "CPU",
      xValueType: "dateTime",
      dataPoints: dps_cpu
    }]
  });

  if (cb) {
    cb();
  }
}

function updateCanvasJS(sensorData) {

  var xVal = Date.now();
  var yVal_temperature = sensorData.temperature;
  var yVal_humidity = sensorData.humidity;
  var yVal_cputemp = sensorData.cputemp

  dps_temp.push({
    x: xVal,
    y: yVal_temperature
  });

  dps_hum.push({
    x: xVal,
    y: yVal_humidity
  });

  dps_cpu.push({
    x: xVal,
    y: yVal_cputemp
  });


  if (dps_temp.length > dataLength) {
    dps_temp.shift();
  }

  if (dps_hum.length > dataLength) {
    dps_hum.shift();
  }

  if (dps_cpu.length > dataLength) {
    dps_cpu.shift();
  }

  chart.render();
}

var socket;

function initSocket() {
  /*
  // If you wanted to add an access token, "Session" is where I store this
  if( Session.token ) {
     options.query = 'access_token=' + Session.token;
  }
  */

  var port = window.location.port,
    host = window.location.hostname,
    protocol = (window.location.protocol.indexOf('https') > -1) ? 'wss:' : 'ws:',
    path = '/';

  var url = protocol + "//" + host + ":" + port + path;
  var options = {};

  socket = io(url, options);
  socket.on('old_data', function(data) {
    var sensorData = data.livedata;
    updateCanvasJS(sensorData);
  });
}

/*global CanvasJS io */
window.onload = function() {

  //init canvas
  initCanvasJS(function() {
    $.get('/sensor', function(data) {
      var sensorData = data.livedata;
      updateCanvasJS(sensorData);
    }, 'json');

    //init socket
    initSocket();
  });
  
};
