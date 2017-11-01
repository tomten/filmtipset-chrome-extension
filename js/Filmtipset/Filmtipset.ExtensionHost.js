"use strict";

/**
 * @constructor
 * @param {Window} window Reference to background page window. Used for getting a reference to he Google Analytics Async Queue which is used for event tracking.
 * @param {Boolean} debug Run in debug mode?
 */
FilmtipsetExtension.ExtensionHost = function(window, debug){
    this.window = window;        
    this.debug = debug;
    this.cache = new Cache(
        -1, // Maximum size of cache = maximum size of storage medium 
        this.debug, // Debug?
        new Cache.LocalStorageCacheStorage("filmtipset2.15")); // Use this extension's Local Storage for persisting the cache
    // TODO: Clear out obsolete caches (every Storage except the one used above)
    this.gradeForTab = {}; // Session-scoped storage for the current page action grades for different browser tabs
    this.wantedList = undefined; // Session-scoped storage for items in the user's Filmtipset Wanted List
    };
    
FilmtipsetExtension.ExtensionHost.prototype.initializeAnalytics = function(){
    this.window._gaq.push(['_setAccount', 'UA-285667-8']); // Same account as released extension in Chrome Web Store
    this.window._gaq.push(['_trackPageview']);
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
    this.window._gaq.push(['_trackEvent', category, action]);
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
    chrome.pageAction.setPopup({ tabId: tabId, popup: "extension-pages/grade.html" }); // TODO
    callback();
    };

FilmtipsetExtension.ExtensionHost.prototype.hidePageActionForTab = function(
        tabId, 
        callback
        ) {            
    chrome.pageAction.hide(tabId);
    chrome.pageAction.setPopup({ tabId: tabId, popup: "" }); // HACK: Is this needed?
    callback();
    };

/**
 * Activates the extension for a page on IMDB.
 * @param {string} tabId Current browser tab ID.
 * @param {string} imdbId IMDB movie ID. 
 */
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
    var self = this;
    film.getInfoForImdbId(
        imdbId,
        /** @param {Object} movieInfo Filmtipset movie info. */
        function(movieInfo) {
            var gradeInfo = film.getGradeInfoMovie(movieInfo);
            self.gradeForTab["tab" + tabId] = gradeInfo;
            var common = new FilmtipsetExtension.Common();
            var iconUrl = common.getIconFromGradeInfo(gradeInfo);
            var title = common.getTitleFromGradeInfo(gradeInfo);
            self.showPageActionForTab(
                iconUrl, 
                title, 
                tabId, 
                function(){}
                );
            }
        );
    };

/** Turns a serialized-and-deserialized Content Script Request into an ACTUAL Content Script Request. */
FilmtipsetExtension.ExtensionHost.prototype.deserializeContentScriptRequest = function(contentScriptRequest) {
    if (contentScriptRequest.type === "FilmtipsetExtension.GradeForLinkRequest") {
        contentScriptRequest.__proto__ = FilmtipsetExtension.GradeForLinkRequest.prototype;
        }
    if (contentScriptRequest.type === "FilmtipsetExtension.GradeForSearchRequest") {
        contentScriptRequest.__proto__ = FilmtipsetExtension.GradeForSearchRequest.prototype;
        } 
    if (contentScriptRequest.type === "FilmtipsetExtension.ActivateImdbPageRequest") {
        contentScriptRequest.__proto__ = FilmtipsetExtension.ActivateImdbPageRequest.prototype;
        } 
    if (contentScriptRequest.type === "FilmtipsetExtension.TrackRequest") {
        contentScriptRequest.__proto__ = FilmtipsetExtension.TrackRequest.prototype;
        } 
    };

/** Handles a Grade For Search request from a content script. */
FilmtipsetExtension.ExtensionHost.prototype.handleGradeForSearchRequest = function(gradeForSearchRequest, port) {
    var film2 = new FilmtipsetExtension.FilmtipsetApi(
        localStorage.accessKey, 
        localStorage.userKey, 
        this.cache, 
        this.log
        );
    var titleToSearchFor = gradeForSearchRequest.query;
    var endingThe = /, The$/;
    if (titleToSearchFor.match(endingThe)) {
        titleToSearchFor = 'The ' + titleToSearchFor.replace(endingThe, '');
        }
    film2.searchExact(
        titleToSearchFor, 
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
                    gradeForSearchRequest.reference, 
                    iconUrl, 
                    movieInfo 
                    )
                );
            }
        );
    };
    
/** Handles a Grade For Link request from a content script. */
FilmtipsetExtension.ExtensionHost.prototype.handleGradeForLinkRequest = function(gradeForLinkRequest, port) {
    var film = new FilmtipsetExtension.FilmtipsetApi(
        localStorage.accessKey, 
        localStorage.userKey, 
        this.cache, 
        this.log
        );
    film.getInfoForImdbId(
        gradeForLinkRequest.imdbId,
        function(movieInfo) {
            var gradeInfo = film.getGradeInfoMovie(movieInfo);
            var common = new FilmtipsetExtension.Common();
            var iconUrl = common.getIconFromGradeInfo(gradeInfo);
            port.postMessage(
                new FilmtipsetExtension.ContentScriptRequestCallback( 
                    gradeForLinkRequest.reference, 
                    iconUrl, 
                    movieInfo 
                    )
                );
            }
        );
    };
    
FilmtipsetExtension.ExtensionHost.prototype.initializeMessageListener = function(){
    var self = this;
    // for complex messaging, use a port
    chrome.runtime.onConnect.addListener(
        /** @param {Object} port */
        function(port) {
            self.log("Content script connected");
            port.onDisconnect.addListener(function() { self.log("Content script disconnected"); });
            port.onMessage.addListener(
                /** @param {(FilmtipsetExtension.ActivateImdbPageRequest|FilmtipsetExtension.TrackRequest|FilmtipsetExtension.GradeForLinkRequest|FilmtipsetExtension.GradeForSearchRequest)} contentScriptRequest Request from content script. */
                function(contentScriptRequest) {
                    self.deserializeContentScriptRequest(contentScriptRequest);
                    if (contentScriptRequest instanceof FilmtipsetExtension.GradeForLinkRequest) {
                        self.handleGradeForLinkRequest(contentScriptRequest, port);
                        } 
                    if (contentScriptRequest instanceof FilmtipsetExtension.GradeForSearchRequest) {
                        self.handleGradeForSearchRequest(contentScriptRequest, port);
                        } 
                    }
                );
            }
        );
    // for simple messaging, don't use a port
    chrome.runtime.onMessage.addListener(
        /**
         @param {(FilmtipsetExtension.ActivateImdbPageRequest|FilmtipsetExtension.TrackRequest|FilmtipsetExtension.GradeForLinkRequest|FilmtipsetExtension.GradeForSearchRequest)} request Request from content script.
         @param {{ tab }} sender Sending tab.
         */
        function(
            request, 
            sender
            ) {
            self.deserializeContentScriptRequest(request);
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
