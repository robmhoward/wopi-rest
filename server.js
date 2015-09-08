var fallbackPort = 9001;
var port = process.env.PORT || fallbackPort;
var express = require('express');
var https = require('https');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var request = require('request');
var mime = require('mime');
var app = express();

app.use(cookieParser());
app.use(bodyParser.json()); // for parsing application/json


var providers = [
	{
		name: "microsoft.sharepoint.com",
		serviceBaseUrl: "https://microsoft.sharepoint.com/_api/",
		accessToken: "<token here>",
		refreshToken: "<token here>"
	},
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
	},
	{
		name: "blue-chicken.com",
		serviceBaseUrl: "http://pruekered800.redmond.corp.microsoft.com/th/handler/wopi/",
		accessToken: "1%7CGN%3DR3Vlc3Q%3D%26SN%3DMjA5MDY2MTk4Mg%3D%3D%26IT%3DNTI0NzQ1OTM3NTE4NDQ5NzgzMw%3D%3D%26PU%3DMjA5MDY2MTk4Mg%3D%3D%26SR%3DYW5vbnltb3Vz%26TZ%3DMTExOQ%3D%3D%26SA%3DRmFsc2U%3D%26LE%3DRmFsc2U%3D%26AG%3DVHJ1ZQ%3D%3D%26RH%3Dy8%5FXq5i56BJnLIzdpW%2DOMuuR4mRLckeMnsi8%5FzXB9TU%3D",
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

function getProviderItemMetadata(providerName, itemId, callback) {
	var provider = getStorageProvider(providerName);
	var requestUrl = provider.serviceBaseUrl + "files/" + itemId + "?access_token=" + provider.accessToken;
	
	request({
		url: requestUrl,
		method: "GET",
		json: true
	}, function (error, response, body) {
		if (error) {
			console.log(error);
			callback(error);
			return;
		}
		callback(null, {
			"id": "0123456789abc",
			"name": body.BaseFileName,
			"lastModifiedDateTime": body.LastModifiedTime,
			"size": body.Size,
			"webUrl": body.HostEditUrl,
			"parentReference": { "id": body.BreadcrumbFolderUrl.split('path=')[1] },
			"file" : {
				"mimeType" : "" 
			}
		});
	});
}

function getProvideItemContent(providerName, itemId, callback) {
	var provider = getStorageProvider(providerName);
	var requestUrl = provider.serviceBaseUrl + "files/" + itemId + "/contents?access_token=" + provider.accessToken;
	
	request({
		url: requestUrl,
		method: "GET"
	}, function (error, response, body) {
		if (error) {
			console.log(error);
			callback(error);
			return;
		}
		var idArray = itemId.split('~');
		callback(null, idArray[idArray.length - 1], body);
	});
}

function getProviderChildrenMetadata(providerName, itemId, callback) {
	var provider = getStorageProvider(providerName);
	var requestUrl = provider.serviceBaseUrl + "containers/" + itemId + "/children?access_token=" + provider.accessToken;
	
	request({
		url: requestUrl,
		method: "GET",
		json: true
	}, function (error, response, body) {
		if (error) {
			console.log(error);
			callback(error);
			return;
		}
		
		var responseBody = {
			values: []
		};
		
		if (body && body.ChildContainers && body.ChildFiles) {
		
			for (var i = 0; i < body.ChildContainers.length; i++) {
				var folder = body.ChildContainers[i];
				responseBody.values.push({
					id: folder.Url.split('/containers/')[1].split('?')[0],
					name: folder.Name,
					folder: {}
				});
			}
			
			for (var i = 0; i < body.ChildFiles.length; i++) {
				var file = body.ChildFiles[i];
				responseBody.values.push({
					id: file.Url.split('/files/')[1].split('?')[0],
					size: file.Size,
					name: file.Name,
					file: {}
				});
			}
			
			callback(null, responseBody);
		} else {
			console.log("something didn't come back");
			callback({message: "something didn't come back"});
		}
	});
}

app.get('/api/me/cloudStorageProviders/', function(request, response) {
	response.send({ value: providers});
	response.end();
});

app.get('/api/me/cloudStorageProviders/:providerName', function(request, response) {
	var provider = getStorageProvider(request.params.providerName);
	returnJsonItemOr404(provider, response);
});

app.get('/api/me/cloudStorageProviders/:providerName/root', function(req, response) {
	var provider = getStorageProvider(req.params.providerName);
	var getRootContainerUrl = provider.serviceBaseUrl + "ecosystem/root_container_pointer?access_token=" + provider.accessToken;
	
	request({
		url: getRootContainerUrl,
		method: "GET",
		json: true
	}, function (error, rootContainerResponse, rootContainerBody) {
		if (error) {
			console.log(error);
			response.send(500, "Big ole error");
			response.end();
			return;
		}
		
		request({
			url: rootContainerBody.ContainerPointer.Url,
			method: "GET",
			json: true
		}, function (error, containerResponse, containerBody) {
			if (error) {
				console.log(error);
				response.send(500, "Big ole error");
				response.end();
				return;
			}
			
			var rootObject = {
				"id": containerBody.Name,
				"name": containerBody.Name,
				//"eTag": "etag",
				//"cTag": "etag",
				//"createdBy": { "user": { "id": "1234", "displayName": "Ryan Gregg" } },
				//"createdDateTime": "datetime",
				//"lastModifiedBy": { "user": { "id": "1234", "displayName": "Ryan Gregg" } },
				//"lastModifiedDateTime": "datetime",
				//"size": 1234,
				"webUrl": containerBody.HostUrl,
				//"parentReference": { "driveId": "12345", "id": "root", "path": "/drive/root:" },
				//"folder": { "childCount": 4 }
			};
			
			returnJsonItemOr404(rootObject, response);
		});
	});
});


app.get('/api/me/cloudStorageProviders/:providerName/items/:itemId', function(req, response) {
	getProviderItemMetadata(req.params.providerName, req.params.itemId, function(error, item) {
		returnJsonItemOr404(item, response);		
	});
});

app.get('/api/me/cloudStorageProviders/:providerName/items/:itemId/children', function(req, response) {
	getProviderChildrenMetadata(req.params.providerName, req.params.itemId, function(error, children) {
		returnJsonItemOr404(children, response);		
	});
});

app.patch('/api/me/cloudStorageProviders/:providerName/items/:itemId', function(request, response) {
	var itemMetadata = getProviderItemMetadata(request.params.providerName, request.params.itemId);
	returnJsonItemOr404(itemMetadata);
});

app.get('/api/me/cloudStorageProviders/:providerName/items/:itemId/content', function(request, response) {
	getProvideItemContent(request.params.providerName, request.params.itemId, function(error, fileName, content) {
		response.setHeader('Content-disposition', 'attachment; filename=' + fileName);
		response.setHeader('Content-Type', 'application/octet-stream');
		response.send(content);
		response.end();
	});
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