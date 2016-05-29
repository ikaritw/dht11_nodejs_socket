var cp = require('child_process');

var options = {
    encoding: 'utf8',
    timeout: 0, /*子进程最长执行时间 */
    maxBuffer: 200 * 1024,  /*stdout和stderr的最大长度*/
    killSignal: 'SIGTERM',
    cwd: null,
    env: null
};
/*
cp.exec('./takePicture.sh',options,function(err,stdout,stderr){
  console.log(err,stdout,stderr);
});
*/
var stdout = {};
try {
    stdout["uname"] = cp.execSync('uname -n', options).replace(/\n/, '');
    stdout["whoami"] = cp.execSync('whoami', options).replace(/\n/, '')
    stdout["hostname"] = cp.execSync('hostname -I', options).replace(/\n/, '');
    stdout["AdafruitDHT"] = cp.execSync('/opt/AdafruitDHT.py 11 2', options).replace(/\n/, '');
    if (stdout.AdafruitDHT) {
        //Temp=25.0*  Humidity=49.0%
        var temp = {};
        var arr = stdout.AdafruitDHT.split(/\s/);
        for (var i = 0; i < arr.length; i++) {
            if (arr[i] && arr[i].indexOf("=") > -1) {
                var k_v = arr[i].split("=");
                temp[k_v[0]] = k_v[1];
                if (!isNaN(parseFloat(k_v[1]))) {
                    temp[k_v[0]] = parseFloat(k_v[1]);
                }
            }
        }
        stdout.AdafruitDHT = temp;
    }

} catch (ex) {
    stdout["ex"] = ex;
}
console.log(stdout);
