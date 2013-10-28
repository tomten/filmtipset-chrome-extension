$(function(){
    if (
        location.hostname.indexOf("imdb") === -1 &&
        location.hostname.indexOf("google") === -1 
        ) { // Don't run this on IMDB or Google Movies
        // TODO: hostname detection must match the one in manifest.json
        var links = new FilmtipsetExtension.Links($);
        links.processLinks();
        }
    });