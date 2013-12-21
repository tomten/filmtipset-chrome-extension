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
    
FilmtipsetExtension.ExtensionHost.prototype.initializeMessageListener = function(){
    var self = this;
    
    chrome.runtime.onConnect.addListener(function(port) {
        port.onMessage.addListener(function(contentScriptRequest) {
            
            if (contentScriptRequest.type === "FilmtipsetExtension.GradeForLinkRequest") {
                contentScriptRequest.__proto__ = FilmtipsetExtension.GradeForLinkRequest.prototype;
                }

            if (contentScriptRequest instanceof FilmtipsetExtension.GradeForLinkRequest) {
                console.log("got gradeForLink request message for #" + contentScriptRequest.reference); // HACK
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
                        console.log("posting return message for #" + contentScriptRequest.reference); // HACK
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
            
            if (request.type === "FilmtipsetExtension.ActivateImdbPageRequest") {
                request.__proto__ = FilmtipsetExtension.ActivateImdbPageRequest.prototype;
            } else if (request.type === "FilmtipsetExtension.TrackRequest") {
                request.__proto__ = FilmtipsetExtension.TrackRequest.prototype;
            } else if (request.type === "FilmtipsetExtension.GradeForSearchRequest") {
                request.__proto__ = FilmtipsetExtension.GradeForSearchRequest.prototype;
            } // TODO: Automate this somehow... without eval
            
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
            
            if (request instanceof FilmtipsetExtension.GradeForSearchRequest) {
                var film2 = new FilmtipsetExtension.FilmtipsetApi(
                    localStorage.accessKey, 
                    localStorage.userKey, 
                    self.cache, 
                    self.log
                    );
                var titleToSearchFor = request.query;
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
                        callback(
                            new FilmtipsetExtension.ContentScriptRequestCallback(
                                request.reference,  
                                iconUrl, 
                                movieInfo 
                                )
                            );
                        }
                    );
                } 
            }
            
        ); 
    }; 
    
var hosten = new FilmtipsetExtension.ExtensionHost(null);
hosten.initializeLocalStorage();
hosten.initializeMessageListener();
