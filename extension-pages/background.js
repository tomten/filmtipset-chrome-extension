var _gaq = _gaq || [];
var hosten = new FilmtipsetExtension.ExtensionHost(this, true); // TODO: debug
hosten.initializeLocalStorage();
hosten.initializeMessageListener();
hosten.initializeAnalytics();