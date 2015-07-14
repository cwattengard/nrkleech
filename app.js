/// <reference path="typings/tsd.d.ts"/>
var r = require("request");
var c = require("cheerio");
var S = require("string");
var ffmpeg = require("fluent-ffmpeg");
var san = require("sanitize-filename");
var async = require("async");

var queue = async.queue(grabShow, 4);

var show = r("https://tv.nrk.no/program/Episodes/jungelgjengen/46302", function(error, response, body) {
	var eps = [];
	var $ = c.load(body);
	$(".episode-item:not(.no-rights)>a").each(function () {
		eps.push($(this).attr("href"));
	});
	console.log("Henter " + eps.length + " episoder");
	for (var i = 0; i < eps.length; i++) {
		var element = eps[i];
		queue.push(element);
	}
});

function grabShow(url, callback) {
	var page = r("https://tv.nrk.no" + url, function(error, response, body) {
	//console.log(body);
	
	var $ = c.load(body);
	var streamlink = $("#playerelement").data("hls-media");
	var title = san($("h1").text());
	console.log("Henter " + title);
	var modlink = S(streamlink).replaceAll("master.m3u8", "index_2_av.m3u8?null=#EXT-X-STREAM-INF:PROGRAM-ID=1,BANDWIDTH=2390000,RESOLUTION=1280x720");
	//console.log(modlink);
	var cmd = ffmpeg()
				.input(modlink.s)
				.audioCodec("copy")
				.videoCodec("copy")
				.on('end', function() {
				    console.log('file has been converted succesfully');
					callback();
				  })
				  .on('error', function(err) {
				    console.log('an error happened: ' + err.message);
				  })
				.on("progress", function(progress) {
					console.log("Progress on " + title + " is " + progress.percent);
				})
				.save(title + ".mkv");
});

}
