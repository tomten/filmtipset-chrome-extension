"use strict";

/**
 * @constructor
 * @param {Array} gaq Reference to Google Analytics Async Queue. Used for event tracking.
 */
FilmtipsetExtension.ExtensionHost = function(gaq, debug){
    this.gaq = gaq;        
    this.debug = debug;
    this.cache = new Cache(
        -1, // Maximum size of cache = maximum size of storage medium 
        this.debug, // Debug?
        new Cache.LocalStorageCacheStorage("filmtipset2.11")); // Use this extension's Local Storage for persisting the cache
    // TODO: When to clear out obsolete caches?
    this.gradeForTab = {}; // Session-scoped storage for the current page action grades for different browser tabs
    this.wantedList = undefined; // Session-scoped storage for items in the user's Filmtipset Wanted List
    };
    
FilmtipsetExtension.ExtensionHost.prototype.initializeAnalytics = function(){
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
    // TODO: window._gaq.push(['_trackEvent', category, action]);
    };

FilmtipsetExtension.ExtensionHost.prototype.initializeLocalStorage = function(){
    localStorage.accessKey = "xtyrZqwjC7I1AVrX5e0TOw";
    if (!localStorage.userKey) {
        chrome.tabs.create({ url: "extension-pages/personal.html", selected: true });
        }
    };

FilmtipsetExtension.ExtensionHost.prototype.createAndSelectTab = function(url){
    chrome.tabs.create({ url: url, selected: true });
    };

FilmtipsetExtension.ExtensionHost.prototype.log = function(message) {
    if (this.debug) {
        console.log(message);
        }
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
        /**
         * @param {Object} movieInfo Filmtipset movie info.
         */
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
    
FilmtipsetExtension.ExtensionHost.prototype.initializeMessageListener = function(){
    var self = this;
    
    chrome.runtime.onConnect.addListener(
        /**
         * @param {chrome.runtime.Port} port
         */
        function(port) {
        self.log("Content script connected");
        port.onDisconnect.addListener(function() {
            self.log("Content script disconnected");
            });
        port.onMessage.addListener(function(contentScriptRequest) {
            
            if (contentScriptRequest.type === "FilmtipsetExtension.GradeForLinkRequest") {
                contentScriptRequest.__proto__ = FilmtipsetExtension.GradeForLinkRequest.prototype;
                }

            if (contentScriptRequest.type === "FilmtipsetExtension.GradeForSearchRequest") {
                contentScriptRequest.__proto__ = FilmtipsetExtension.GradeForSearchRequest.prototype;
                } 
            
            if (contentScriptRequest instanceof FilmtipsetExtension.GradeForLinkRequest) {
                var film = new FilmtipsetExtension.FilmtipsetApi(
                    localStorage.accessKey, 
                    localStorage.userKey, 
                    self.cache, 
                    self.log
                    );
                film.getInfoForImdbId(
                    contentScriptRequest.imdbId,
                    function(movieInfo) {
                        var gradeInfo = film.getGradeInfoMovie(movieInfo);
                        var common = new FilmtipsetExtension.Common();
                        var iconUrl = common.getIconFromGradeInfo(gradeInfo);
                        port.postMessage(
                            new FilmtipsetExtension.ContentScriptRequestCallback( 
                                contentScriptRequest.reference, 
                                iconUrl, 
                                movieInfo 
                                )
                            );
                        }
                    );
                } 
            
            if (contentScriptRequest instanceof FilmtipsetExtension.GradeForSearchRequest) {
                var film2 = new FilmtipsetExtension.FilmtipsetApi(
                    localStorage.accessKey, 
                    localStorage.userKey, 
                    self.cache, 
                    self.log
                    );
                var titleToSearchFor = contentScriptRequest.query;
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
                        port.postMessage(
                            new FilmtipsetExtension.ContentScriptRequestCallback( 
                                contentScriptRequest.reference, 
                                iconUrl, 
                                movieInfo 
                                )
                            );
                        }
                    );
                } 
                
            });
        });
    
    chrome.runtime.onMessage.addListener(
        /**
         @param {(FilmtipsetExtension.ActivateImdbPageRequest|FilmtipsetExtension.TrackRequest|FilmtipsetExtension.GradeForLinkRequest|FilmtipsetExtension.GradeForSearchRequest)} request Request from content script.
         @param {{ tab }} sender Sending tab.
         @param {function(*)} callback Callback function to content script.
         */
        function(
            request, 
            sender, 
            callback
            ) {
            
            // TODO: Automate this somehow... without eval
            
            if (request.type === "FilmtipsetExtension.ActivateImdbPageRequest") {
                request.__proto__ = FilmtipsetExtension.ActivateImdbPageRequest.prototype;
            } 
            
            if (request.type === "FilmtipsetExtension.TrackRequest") {
                request.__proto__ = FilmtipsetExtension.TrackRequest.prototype;
            } 
            
            if (request instanceof FilmtipsetExtension.ActivateImdbPageRequest) {
                self.activateImdbPage(
                    sender.tab.id, 
                    request.imdbId
                    );
                } 
            
            if (request instanceof FilmtipsetExtension.TrackRequest) {
                self.track(
                    request.category, 
                    request.action
                    );
                }
            }
            
        );
        
    }; 
    
// TODO: move code below to "event page initializer" script file
var hosten = new FilmtipsetExtension.ExtensionHost(null, true); // TODO
hosten.initializeLocalStorage();
hosten.initializeMessageListener();
