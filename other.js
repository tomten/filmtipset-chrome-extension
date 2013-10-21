$(function(){
    if (location.hostname.indexOf("imdb") === -1) { // Don't run this on IMDB
        var links = new FilmtipsetExtension.Links($);
        links.processLinks();
        }
    });