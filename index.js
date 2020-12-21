const {
  Worker,
  isMainThread,
  BroadcastChannel, 
  workerData
} = require('worker_threads');
const crypto = require("crypto");
const fs = require("fs");
const files = [{
  path: 'a.png',
  hash: 'c7c3c7f24d1655ee6f7936044afa8f7ed8ad9d64'
}, {
  path: 'b.png',
  hash: '4920d622b60e1025a12e237ee9e71362df408c3b'
}];
const bc = new BroadcastChannel('check');

if (isMainThread) {
  let count = 0;
  files.forEach((file) => {
    new Worker(__filename, {workerData: file.path});
    bc.onmessage = (event) => {
      const paths = files.map(item => item.path);
      const index = paths.findIndex(path => path === event.data.path);
      console.log(
        `Hash check - ${event.data.path}`,
        files[index].hash === event.data.hash
      );
      if (++count === files.length) bc.close();
    };
  })
} else {
    const algorithm = "sha1";
    const shasum = crypto.createHash(algorithm);
    const stream = fs.ReadStream(workerData);
    stream.on("data", function(data) {
      shasum.update(data);
    });
    stream.on("end", function() {
      const hash = shasum.digest("hex");
      bc.postMessage({path: workerData, hash: hash});
      bc.close();
    });
}
