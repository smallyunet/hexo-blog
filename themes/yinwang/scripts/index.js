var http = require("http");
var https = require("https");
fs = require("fs");

const path2020 = '/repos/smallyunet/hexo-blog/issues/7/comments?per_page=100'
const fill2020 = "./source/micro-blog/2020.json"

let requestPath = path2020
let responsePath = fill2020

var options = {
  host: "api.github.com",
  path: requestPath,
  method: "GET",
  headers: { "user-agent": "node.js" }
};

callback = function (response) {
  var buffer = Buffer.from("")

  response.on("data", function (buf) {
    buffer = Buffer.concat([buffer, buf])
  });

  response.on("end", function () {
    fs.writeFile(responsePath, buffer.toString(), 'utf8', (err) => {
      if (err) {
        console.log('[micro-blog] Save data fail. ', err);
      } else {
        console.log(`[micro-blog] Save data success.`);
      }
    });
  });

  response.on("error", function (err) {
    next(err);
  });
};

const [,, ...args] = process.argv
args.map(i => {
  if (i == '--micro-blog') {
    console.log('[micro-blog] Start request data.');
    https.request(options, callback).end();
  }
})

