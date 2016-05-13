function getDateTime() {
	var time = new Date().getTime();
	// 32400000 is (GMT+9 Japan)
	// for your timezone just multiply +/-GMT by 36000000
	//var datestr = new Date(time + 19800000).toISOString().replace(/T/, ' ').replace(/Z/, '');
	var dateTime = time; //+ 19800000;
	return dateTime;
}

var dps_temp = []; // dataPoints
var dps_hum = []; // dataPoints
var chart_temp;
var chart_hum;
var UI_UPDATE_RATE = 5;
var dataLength = (60 / 5) * 60 * 8; // number of dataPoints visible at any point
function initCanvasJS() {
	chart_temp = new CanvasJS.Chart("chartContainerTemp", {
		title: {
			text: "Live Temperature"
		},
		zoomEnabled: true,
		zoomType: "xy",
		theme: "theme1",
		axisY: {
			title: "Temperature (C)",
		},
		axisX: {
			title: "Time",
		},
		data: [{
			type: "line",
			xValueType: "dateTime",
			dataPoints: dps_temp
		}]
	});
	chart_hum = new CanvasJS.Chart("chartContainerHum", {
		title: {
			text: "Live Humidity"
		},
		zoomEnabled: true,
		zoomType: "xy",
		theme: "theme1",
		axisY: {
			title: "Humidity (%)",
		},
		axisX: {
			title: "Time",
		},

		data: [{
			type: "line",
			xValueType: "dateTime",
			dataPoints: dps_hum
		}]
	});
	updateCanvasJS(getDateTime(), 0, 0); //初始化
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
	chart_temp.render();
	chart_hum.render();
}

var socket;
var livedata;

function initSocket() {
	/*
	// If you wanted to add an access token, "Session" is where I store this
	if( Session.token ) {
	   options.query = 'access_token=' + Session.token;
	}
	*/
	var xVal = getDateTime();
	var yVal_temp = 100;
	var yVal_hum = 100;

	var updateInterval = 1000;

	var port = window.location.port,
		host = window.location.hostname,
		protocol = (window.location.protocol.indexOf('https') > -1) ? 'wss:' : 'ws:',
		path = '/';

	var url = protocol + "//" + host + ":" + port + path;
	var options = {};

	socket = io(url, options);
	socket.on('old_data', function(data) {
		//console.log(data);
		livedata = data;
		var sensorData = data.livedata;
		var temp = sensorData.temperature;
		var hum = sensorData.humidity;

		xVal = getDateTime();
		yVal_temp = temp;
		yVal_hum = hum;

		updateCanvasJS(xVal, yVal_temp, yVal_hum);
	});
}

/*global CanvasJS io */
window.onload = function() {
	//var socket = io.connect('http://10.95.145.56:5002');
	initCanvasJS();
	initSocket();
};
