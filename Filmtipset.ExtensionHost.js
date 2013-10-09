"use strict";

/**
 * @constructor
 * @param {Array} gaq Reference to Google Analytics Async Queue. Used for event tracking.
 */
FilmtipsetExtension.ExtensionHost = function (gaq){
    this.gaq = gaq;        
    this.cache = new Cache();        
    this.gradeForTab = {};
    this.wantedList = undefined;
    }
    
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
        chrome.tabs.create({ url: "personal.html", selected: true });
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
            var gradeInfo = film.getGradeInfo(movieInfo);
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
    chrome.extension.onRequest.addListener(function(
            request, 
            sender, 
            callback
            ) {
        if (request.action === "activateImdbPage") {
            filmtips.activateImdbPage(sender.tab.id, request.imdbId);
        } else if (request.action === "track") {
            filmtips.track(
                request.trackCategory, 
                request.trackAction
                );
        } else if (request.action === "gradeForLink") {
            var film = new FilmtipsetExtension.FilmtipsetApi(
                localStorage.accessKey, 
                localStorage.userKey, 
                filmtips.cache, 
                filmtips.log
                );
            film.getInfoForImdbId(
                '' + request.imdbId,
                function(movieInfo) {
                    var gradeInfo = film.getGradeInfo(movieInfo);
                    var common = new FilmtipsetExtension.Common();
                    var iconUrl = common.getIconFromGradeInfo(gradeInfo);
                    callback({ 
                        fakeId: request.fakeId, 
                        grade: iconUrl, 
                        movieInfo: movieInfo 
                        });
                    }
                );
            } 
        } 
    ); 
    }; 
    
var _gaq = _gaq || []; // window-scoped variable for Google Analytics
var filmtipset = new FilmtipsetExtension.ExtensionHost(_gaq);
filmtipset.initAnalytics();
filmtipset.initLocalStorage();
filmtipset.initRequestListener();
