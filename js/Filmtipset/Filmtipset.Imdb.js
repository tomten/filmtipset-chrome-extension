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
        chrome.runtime.sendMessage(new FilmtipsetExtension.ActivateImdbPageRequest(imdbId)); 
        chrome.runtime.sendMessage(new FilmtipsetExtension.TrackRequest("imdb", "showGradeOnImdb"));
        }
    };