var _gaq = _gaq || []; // window-scoped variable for Google Analytics
var filmtipset = new FilmtipsetExtension.ExtensionHost(_gaq);
filmtipset.initAnalytics();
filmtipset.initLocalStorage();
filmtipset.initRequestListener();
