var imdb = new FilmtipsetExtension.Imdb(window.location.href);
imdb.init();

$(function(){
    var links = new FilmtipsetExtension.Links($);
    links.processLinksOnImdb();
    });