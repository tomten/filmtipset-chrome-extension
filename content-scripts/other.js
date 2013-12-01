$(function(){
    if (
        window.location.hostname.indexOf("imdb") === -1 &&
        window.location.hostname.indexOf("google") === -1 &&
        window.location.hostname.indexOf("nyheter24") === -1 
        ) { // Don't run this on Filmtipset, IMDB or Google Movies
        // TODO: hostname detection must match the one in manifest.json
        var links = new FilmtipsetExtension.Links($);
        links.processLinks();
        }
    });