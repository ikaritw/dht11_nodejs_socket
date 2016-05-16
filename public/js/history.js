
var chart_temp;
var chart_hum;

var dps_temp=[],dps_hum=[];

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
	
	$.post('',function(data){
	  chartRender(data);
	});
}

function chartRender(data){
  dps_temp = data.dps_temp;
	dps_hum = data.dps_hum;
	
  chart_temp.render();
	chart_hum.render();
}

/*global CanvasJS io */
window.onload = function() {
	//var socket = io.connect('http://10.95.145.56:5002');
	initCanvasJS();
};
