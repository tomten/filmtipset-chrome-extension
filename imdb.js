"use strict";

// constructor
function Imdb(href){
	this.href = href;
	this.common = new Common();
	}

Imdb.prototype.init = function(){
	var imdbId = this.common.getImdbIdFromUrl(this.href);
	if (imdbId) {
		chrome.extension.sendRequest({ 
				action: "activateImdbPage", 
				imdbId: imdbId 
				});
		chrome.extension.sendRequest({ 
				action: "track", 
				trackCategory: "imdb", 
				trackAction: "showGradeOnImdb" 
				});
		}
	};

var imdb = new Imdb(window.location.href);
imdb.init();