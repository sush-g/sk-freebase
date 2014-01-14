var request = require('superagent');
var http = require('http-get');
var data = require('sk-utils');

var textServiceURL = 'https://www.googleapis.com/freebase/v1/text';
var MQLReadServiceURL = 'https://www.googleapis.com/freebase/v1/mqlread';
var imageServiceURL = 'https://usercontent.googleapis.com/freebase/v1/image';

/* getMQLRead : For MQL read service.
	- input : (query, options, callback)
		- options :
			- key : freebase API key
			- cursor : cursor to the query for large results.
			- recurse : flag to recurse (appends cursor to freebase CALL)
		- callback : Final callback to be called after result is recieved from freebase.
*/
var getMQLRead = function (query, options, callback) {
	// Cleaning options.
	options = options || {};
	options.html_escape = options.html_escape || false;
	options.key = options.key;

	// Building query options.
	var queryOptions = {	
							query: JSON.stringify(query), 
							html_escape: options.html_escape,
							key: options.key
						};

	var serviceURL = MQLReadServiceURL;
	
	if (options.recurse) {
		if (options.cursor) queryOptions.cursor = options.cursor;
		else serviceURL += '?cursor';
	}

	request
	.get(serviceURL)
	.query(queryOptions)
	.set({ Accept: 'application/json' })
	.end(function(res) {
		callback(res.error, res.body);
	});
};

/* getFreebaseText : For Freebase text service.
	- input : (mid, options, callback)
		- options :
			- key : freebase API key
			- maxlength : maximum length of text snippet freebase entity.
		- callback : Final callback to be called after the result is retrieved freebase
					and sanitized.
*/
var getFreebaseText = function(mid, options, callback) {
	// Cleaning options
	options = options || {};
	options.key = options.key;

	// Building query options.
	var queryOptions = {};
	if (options.key)
		queryOptions.key = options.key;
	if (options.maxlength)
		queryOptions.maxlength = options.maxlength;

	request
	.get(textServiceURL + mid)
	.query(queryOptions)
	.set({ Accept: 'application/json' })
	.end(function(res) {
		var textSnippet = res.body.result;
		if (textSnippet)
			textSnippet = data.cleanSpacing(textSnippet);
		callback(res.error, textSnippet);
	});
};

/* getFreebaseImage : For Freebase image service.
	- input : (mid, path, options, callback)
		- options :
			- key : freebase API key.
			- maxheight : image max height.
			- maxwidth : image max width.
		- callback : Final callback to be called after the image is downloaded / failed.
*/
var getFreebaseImage = function(mid, path, options, callback) {
	options = options || {};
	options.key = options.key;
	
	var queryOptions = {};
	if (options.maxheight) queryOptions.maxheight = options.maxheight;
	if (options.maxwidth) queryOptions.maxwidth = options.maxwidth;
	if (options.key) queryOptions.key = options.key;

	var imageURL = imageServiceURL + mid + '?' + data.serialize(queryOptions);
	http.get(imageURL, path, function (error, result) {
		callback(error, (result || {}).file);
	});
};

// Exports
exports.getMQLRead = getMQLRead;
exports.getFreebaseText = getFreebaseText;
exports.getFreebaseImage = getFreebaseImage;

// Won't run, need API key in options.
// getMQLRead([{	"type": "/film/film",
// 				"directed_by!=": "",
// 				"genre!=": "",
// 				"mid": null,
// 				"produced_by!=": "",
// 				"limit": 100
// 			}], null, console.log);
// getFreebaseText("/m/0f4_l", {maxlength: 225}, console.log);
// getFreebaseImage("/m/0f4_l", "./pulp-fiction", null, console.log);