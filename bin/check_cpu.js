// CPU tempetature
var exec = require('child_process').exec;
var child;
var cpu_tempe;

setInterval(function() {
  child = exec("/bin/cat /sys/class/thermal/thermal_zone0/temp", function(error, stdout, stderr) {
    if (error) {
      log.error('exec error: ' + error);
    }
    else {
      cpu_tempe = parseInt(stdout, 10) / 1000;
      //Ubidots.append_cpu_temperature(cpu_tempe);
      //sensorLog.info('cpu_tempe', cpu_tempe);
      console.log(new Date().toJSON() + ":" + cpu_tempe);
    }
  });
}, 1 * 1000);