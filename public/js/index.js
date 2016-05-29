var dps_temp = []; // dataPoints
var dps_hum = []; // dataPoints
var chart;
var dataLength = (60 / 5) * 60 * 8;

function initCanvasJS() {
    chart = new CanvasJS.Chart("chartContainer", {
        title: {
            text: "Live Temperature & Humidity"
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
        }]
    });

}

function updateCanvasJS(xVal, yVal_temp, yVal_hum) {
    dps_temp.push({
        x: xVal,
        y: yVal_temp
    });

    dps_hum.push({
        x: xVal,
        y: yVal_hum
    });

    if (dps_temp.length > dataLength) {
        dps_temp.shift();
    }

    if (dps_hum.length > dataLength) {
        dps_hum.shift();
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
        //console.log(data);

        var sensorData = data.livedata;

        var xVal = Date.now();
        var yVal_temp = sensorData.temperature;
        var yVal_hum = sensorData.humidity;

        updateCanvasJS(xVal, yVal_temp, yVal_hum);
    });
}

/*global CanvasJS io */
window.onload = function() {
    initCanvasJS();
    initSocket();
};
