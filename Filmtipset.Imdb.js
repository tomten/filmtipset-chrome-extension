"use strict";

/**
 * @constructor
 */
FilmtipsetExtension.Imdb = function (href){
    this.href = href;
    this.common = new FilmtipsetExtension.Common();
    }

FilmtipsetExtension.Imdb.prototype.init = function(){
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