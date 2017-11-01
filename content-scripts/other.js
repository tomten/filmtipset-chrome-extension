$(function(){
  var links = new FilmtipsetExtension.Links($);
  window.setInterval(
    function(){ links.processLinks(); }, 
    2000
  ); // HACK
});