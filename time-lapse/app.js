var cp = require('child_process');

var options = {
  encoding: 'utf8',
  timeout: 0, /*子进程最长执行时间 */
  maxBuffer: 200*1024,  /*stdout和stderr的最大长度*/
  killSignal: 'SIGTERM',
  cwd: null,
  env: null
};
cp.exec('./takePicture.sh',options,function(err,stdout,stderr){
  console.log(err,stdout,stderr);
});