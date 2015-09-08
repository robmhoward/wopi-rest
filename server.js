var fallbackPort = 9000;
var port = process.env.PORT || fallbackPort;
var express = require('express');
var https = require('https');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var app = express();

app.use(cookieParser());
app.use(bodyParser.json()); // for parsing application/json


var providers = [
	{
		name: "microsoft.sharepoint.com",
		serviceBaseUrl: "https://microsoft.sharepoint.com/_api/",
		accessToken: "<token here>",
		refreshToken: "<token here>"
	}
	{
		name: "box.com",
		serviceBaseUrl: "https://api.box.com/",
		accessToken: "<token here>",
		refreshToken: "<token here>"
	},
	{
		name: "dropbox.com",
		serviceBaseUrl: "https://wopi.dropbox.com/wopi/",
		accessToken: "<token here>",
		refreshToken: "<token here>"
	}
];

function getStorageProvider(name) {
	for (var i = 0; i < providers.length; i++) {
		if (providers[i].name == name) {
			return providers[i];
		}
	}
	return null;
}

function getProviderItemMetadata(providerName, itemId) {
	var provider = getStorageProvider(providerName);
	var requestUrl = provider.serviceBaseUrl + "files/" + itemId;
	
}

app.get('/api/me/cloudStorageProviders/', function(request, response) {
	response.send({ value: providers});
	response.end();
});

app.get('/api/me/cloudStorageProviders/:providerName', function(request, response) {
	var provider = getStorageProvider(request.params.providerName);
	returnJsonItemOr404(provider, response);
});

app.get('/api/me/cloudStorageProviders/:providerName/items/:itemId', function(request, response) {
	var itemMetadata = getProviderItemMetadata(request.params.providerName, request.params.itemId);
	returnJsonItemOr404(itemMetadata);
});

app.patch('/api/me/cloudStorageProviders/:providerName/items/:itemId', function(request, response) {
	var itemMetadata = getProviderItemMetadata(request.params.providerName, request.params.itemId);
	returnJsonItemOr404(itemMetadata);
});

app.get('/api/me/cloudStorageProviders/:providerName/items/:itemId/content', function(request, response) {
	var itemMetadata = getProviderItemMetadata(request.params.providerName, request.params.itemId);
	returnJsonItemOr404(itemMetadata);
});

app.put('/api/me/cloudStorageProviders/:providerName/items/:itemId/content', function(request, response) {
	var itemMetadata = getProviderItemMetadata(request.params.providerName, request.params.itemId);
	returnJsonItemOr404(itemMetadata);
});


function returnJsonItemOr404(item, response) {
	if (item) {
		response.send(item);
		response.end();
	} else {
		response.writeHead(404);
		response.send();
	}
}

console.log("Starting server on port " + port + "...");
app.listen(port);