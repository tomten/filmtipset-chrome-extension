"use strict";

/**
 * @constructor
 * @param {Array} gaq Reference to Google Analytics Async Queue. Used for event tracking.
 */
FilmtipsetExtension.ExtensionHost = function(gaq){
    this.gaq = gaq;        
    this.cache = new Cache(
        -1, // Maximum size of cache = maximum size of storage medium 
        false, // Debug?
        new Cache.LocalStorageCacheStorage("filmtipset2.10")); // Use this extension's Local Storage for persisting the cache
    // TODO: When to clear out obsolete caches?
    this.gradeForTab = {}; // Session-scoped storage for the current page action grades for different browser tabs
    this.wantedList = undefined; // Session-scoped storage for items in the user's Filmtipset Wanted List
    };
    
FilmtipsetExtension.ExtensionHost.prototype.initAnalytics = function(){
    this.gaq.push(['_setAccount', 'UA-285667-8']); // Same account as released extension in Chrome Web Store
    this.gaq.push(['_trackPageview']);
    var ga = document.createElement('script');
    ga.type = 'text/javascript';
    ga.async = true;
    ga.src = 'https://ssl.google-analytics.com/ga.js';
    var s = document.getElementsByTagName('script')[0];
    s.parentNode.insertBefore(ga, s);
    };

FilmtipsetExtension.ExtensionHost.prototype.track = function(
        category, 
        action
        ) {
    this.log("tracking " + category + ": " + action);
    window._gaq.push(['_trackEvent', category, action]);
    };

FilmtipsetExtension.ExtensionHost.prototype.initLocalStorage = function(){
    localStorage.accessKey = "xtyrZqwjC7I1AVrX5e0TOw";
    if (!localStorage.userKey) {
        chrome.tabs.create({ url: "extension-pages/personal.html", selected: true });
        }
    };

FilmtipsetExtension.ExtensionHost.prototype.createAndSelectTab = function(url){
    chrome.tabs.create({ url: url, selected: true });
    };

FilmtipsetExtension.ExtensionHost.prototype.log = function(message) {
    console.log(message); 
    };         

FilmtipsetExtension.ExtensionHost.prototype.showPageActionForTab = function(
        iconUrl, 
        title, 
        tabId, 
        callback
        ) {            
    chrome.pageAction.show(tabId);
    chrome.pageAction.setIcon({ tabId: tabId, path: iconUrl });
    chrome.pageAction.setTitle({ tabId: tabId, title: title });
    callback();
    };

FilmtipsetExtension.ExtensionHost.prototype.hidePageActionForTab = function(
        tabId, 
        callback
        ) {            
    chrome.pageAction.hide(tabId);
    callback();
    };

FilmtipsetExtension.ExtensionHost.prototype.activateImdbPage = function(
        tabId, 
        imdbId
        ) {
    var film = new FilmtipsetExtension.FilmtipsetApi(
        localStorage.accessKey, 
        localStorage.userKey, 
        this.cache, 
        this.log
        );
    var tips = this;
    film.getInfoForImdbId(
        imdbId,
        function(movieInfo) {
            var gradeInfo = film.getGradeInfoMovie(movieInfo);
            tips.gradeForTab["tab" + tabId] = gradeInfo;
            var common = new FilmtipsetExtension.Common();
            var iconUrl = common.getIconFromGradeInfo(gradeInfo);
            var title = common.getTitleFromGradeInfo(gradeInfo);
            tips.showPageActionForTab(
                iconUrl, 
                title, 
                tabId, 
                function(){}
                );
            }
        );
    };

FilmtipsetExtension.ExtensionHost.prototype.initRequestListener = function(){
    var filmtips = this;
    chrome.extension.onRequest.addListener(
        /**
         @param {FilmtipsetExtension.ContentScriptRequest} request Request from content script.
         @param {{ tab }} sender Sending tab.
         @param {function(*)} callback Callback function to content script.
         */
        function(
            request, 
            sender, 
            callback
            ) {
            if (request.action === "activateImdbPage") {
                filmtips.activateImdbPage(
                    sender.tab.id, 
                    request.imdbData.imdbId
                    );
            } else if (request.action === "track") {
                filmtips.track(
                    request.trackData.trackCategory, 
                    request.trackData.trackAction
                    );
            } else if (request.action === "gradeForLink") {
                var film = new FilmtipsetExtension.FilmtipsetApi(
                    localStorage.accessKey, 
                    localStorage.userKey, 
                    filmtips.cache, 
                    filmtips.log
                    );
                film.getInfoForImdbId(
                    request.imdbData.imdbId,
                    function(movieInfo) {
                        var gradeInfo = film.getGradeInfoMovie(movieInfo);
                        var common = new FilmtipsetExtension.Common();
                        var iconUrl = common.getIconFromGradeInfo(gradeInfo);
                        callback({ 
                            fakeId: request.imdbData.fakeId, 
                            grade: iconUrl, 
                            movieInfo: movieInfo 
                            });
                        }
                    );
            } else if (request.action === "gradeForLinkText") {
                var film2 = new FilmtipsetExtension.FilmtipsetApi(
                    localStorage.accessKey, 
                    localStorage.userKey, 
                    filmtips.cache, 
                    filmtips.log
                    );
                var titleToSearchFor = request.imdbData.imdbId;
                var endingThe = /, The$/;
                if (titleToSearchFor.match(endingThe)) {
                    titleToSearchFor = 'The ' + titleToSearchFor.replace(endingThe, '');
                }
                film2.searchExact(
                    titleToSearchFor, // HACK: Should be imdbTitle
                    function(movieInfos) {
                        var movieInfo = 
                            movieInfos.length > 0 ? 
                                movieInfos[0] : 
                                {}; // HACK
                        var gradeInfo = film2.getGradeInfoMovie(movieInfo);
                        var common = new FilmtipsetExtension.Common();
                        var iconUrl = common.getIconFromGradeInfo(gradeInfo);
                        callback({ 
                            fakeId: request.imdbData.fakeId, // HACK: Shouldn't be in imdbData 
                            grade: iconUrl, 
                            movieInfo: movieInfo 
                            });
                        }
                    );
                } 
            } 
        ); 
    }; 