"use strict";

/**
 * @constructor
 * @param {string} href IMDB URL.
 */
FilmtipsetExtension.Imdb = function (href){
    this.href = href;
    this.common = new FilmtipsetExtension.Common();
    };

FilmtipsetExtension.Imdb.prototype.init = function(){
    var imdbId = this.common.getImdbIdFromUrl(this.href);
    if (imdbId) {
        chrome.extension.sendRequest(
            new FilmtipsetExtension.ContentScriptRequest(
                "activateImdbPage", 
                null, 
                new FilmtipsetExtension.ContentScriptRequest.ImdbData(imdbId, fakeId)
                )
            );
        chrome.extension.sendRequest(
            new FilmtipsetExtension.ContentScriptRequest(
                "track", 
                new FilmtipsetExtension.ContentScriptRequest.TrackData("imdb", "showGradeOnImdb"), 
                null
                )
            );
        }
    };