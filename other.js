$(function(){
    if (location.hostname.indexOf("imdb") === -1) { // Don't run this on IMDB
        // TODO: IMDB detection must match the one in manifest.json
        var links = new FilmtipsetExtension.Links($);
        links.processLinks();
        }
    });