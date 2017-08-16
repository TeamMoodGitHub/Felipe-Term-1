var server = require('node-router').getServer();

server.get("/", function (request, response){
  response.simpleText(200, "Hello Word!");
});

server.listen(8000,"localhost");
