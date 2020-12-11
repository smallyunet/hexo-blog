var http = require('http');
var https = require('https');
fs = require('fs')

var options = {
	host: 'api.github.com',
	path: '/repos/smallyunet/hexo-blog/issues/7/comments',
	method: 'GET',
	headers: {'user-agent': 'node.js'}
};

callback = function(response) {
  var str = '';

  //another chunk of data has been received, so append it to `str`
  response.on('data', function (chunk) {
    str += chunk;
  });

  //the whole response has been received, so we just print it out here
  response.on('end', function () {
		fs.writeFile('./source/micro-blog/2020.json', str, err => {
			if (err) {
					console.log(err)
			} else {
					console.log(`Get 2020 microblog data success.`)
			}
		})
  });
}

https.request(options, callback).end();