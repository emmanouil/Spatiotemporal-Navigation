//var globalSetIndex = [];	//in helper.js holds EVERYTHING parsed
//var map;	//in maps.js holds MAP

var input_dir = 'parsing';
var playlist_file = 'playlist.txt';
var pl_element_prefix = 'OUT_';
var pl_video_prefix = 'VID_';
var pl_element_extension = '.txt';
var pl_video_extension = '.mp4';
var active_video_id = null;
var mediaSource = new MediaSource();	//Not used for now
//var skeleton_worker = new Worker( 'parser.js' );
var selector, video, playlist;

//after window loads do the init
window.onload = function() {
	video = document.getElementById( 'v' );
	initVideo();	//in video.js
	mediaSource.video = video;
	video.ms = mediaSource;

	fetch( '/' + input_dir + '/' + playlist_file, parse_playlist );

	//	fetch(input_dir+'/'+sample_in, parse_sample, "json");


	//	video.src = window.URL.createObjectURL(mediaSource);
	//	initMSE();
	//	if (withReverb) fetch(reverbFile, initReverb, "arraybuffer");
}

//Content-loading functions
function fetch( what, where, resp_type ) {
	console.log( "fetching " + what );
	if( what.length < 2 ) {
		console.log( "erroneous request" );
	}
	var req = new XMLHttpRequest();
	req.addEventListener( "load", where );
	req.open( "GET", what );
	if( typeof ( resp_type ) != 'undefined' ) {
		req.responseType = resp_type;
	}
	req.send();
}

function parse_sample( resp ) {
	console.log( "got it" );
	sampleData = resp.target.response;
}

function parse_playlist() {
	playlist = this.responseText.split( /\r\n|\r|\n/ ); //split on break-line
	var req_status = this.status;
	if( req_status == 200 && playlist.length > 0 ) {
		console.log( "[NOTE] Fetching " + playlist_file + " OK  - total received elements: " + playlist.length );
		console.log( "[NOTE] Fetching playlist elements..." )
		for(var i = 0;i < playlist.length;i++ ) {
			fetch( input_dir + '/' + pl_element_prefix + playlist[ i ] + pl_element_extension, parse_pl_element, 'json' );
		}
	} else if( req_status == 200 ) {
		console.log( "[NOTE] Fetching " + playlist_file + " returned with an empty file" );
	} else {
		console.log( "[NOTE] Fetching " + playlist_file + " unsuccessful" );
	}
}

function parse_pl_element() {
	if( this.status == 200 ) {
		var tmp_obj = addToIndex(this);	//add to globalSetIndex
		addOption(input_dir + '/'+tmp_obj.videoFile, tmp_obj.id);	//add option to the dropdown
		addMarkers(tmp_obj.set, tmp_obj.index, tmp_obj.id);
	}
	console.log( this )
}

function addMarkers(loc_set, index, file_id){
	var tmp = loc_set[ 0 ].Location;
	if(active_video_id == null){
	    active_video_id = file_id;
		centerMap( tmp.Latitude, tmp.Longitude, current_zoom );
	}
	for(var i =0; i<loc_set.length; i++){
		if(loc_set[i].Location){
			addMarker(loc_set[i].Location.Latitude, loc_set[i].Location.Longitude, index, loc_set[i].Sensor.DurationTotal-loc_set[i].Sensor.Duration, "Marker "+i, radToDeg(loc_set[i].Sensor.X)-90);
		}
	}
}

function addOption(value, file_id) {
    var option = document.createElement("option");
    if (file_id) {
        option.text = file_id;
    } else {
        logERR("text required - used as video id");
    }
    option.value = value;
    selector.add(option);
}

//returns loc_obj
function addToIndex(XMLHttpRequest_in) {
    var loc_obj = new Object();
    loc_obj.index = globalSetIndex.length;
    loc_obj.textFileURL = XMLHttpRequest_in.responseURL;
    loc_obj.id = loc_obj.textFileURL.slice(loc_obj.textFileURL.indexOf(pl_element_prefix) + pl_element_prefix.length, loc_obj.textFileURL.indexOf(pl_element_extension));
    loc_obj.textFile = pl_element_prefix + loc_obj.id + pl_element_extension;
    loc_obj.videoFile = pl_video_prefix + loc_obj.id + pl_video_extension;
    loc_obj.set = XMLHttpRequest_in.response;
    globalSetIndex.push(loc_obj);
    return loc_obj;
}