var fallbackPort = 9000;
var port = process.env.PORT || fallbackPort;
var express = require('express');
var https = require('https');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var app = express();

app.use(cookieParser());
app.use(bodyParser.json()); // for parsing application/json


var providers = [];

app.get('/api/me/cloudStorageProviders/', function(request, response) {
	response.send({ value: providers});
	response.end();

});

app.get('/api/me/cloudStorageProviders/:providerName', function(request, response) {
	var provider = {};
	response.send(provider);
	response.end();
});


console.log("Starting server on port " + port + "...");
app.listen(port);