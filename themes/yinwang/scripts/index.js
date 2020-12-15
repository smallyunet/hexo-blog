var http = require("http");
var https = require("https");
fs = require("fs");

var options = {
  host: "api.github.com",
  path: "/repos/smallyunet/hexo-blog/issues/7/comments?per_page=100",
  method: "GET",
  headers: { "user-agent": "node.js" },
};

callback = function (response) {
  var str = "";

  response.on("data", function (chunk) {
	chunk = chunk.toString('utf-8');
    str += chunk;
  });

  response.on("end", function () {
    fs.writeFile("./source/micro-blog/2020.json", str, (err) => {
      if (err) {
        console.log(err);
      } else {
        console.log(`Get 2020 microblog data success.`);
      }
    });
  });

  response.on("error", function (err) {
    next(err);
  });
};

https.request(options, callback).end();
