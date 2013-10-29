"use strict";

/**
 * @constructor
 */
FilmtipsetExtension.Common = function (){};

FilmtipsetExtension.Common.prototype.getImdbIdFromUrl = function(url) {
    var re = /\/tt(\d+)\D/i;
    var match = url.match(re);
    if (match) {
        if (match.length === 2) {
            var imdbId = match[1];
            return imdbId;
        }
    }
    return null;
};

FilmtipsetExtension.Common.prototype.log = function(message) {
    chrome.extension.getBackgroundPage().log(message); 
}; 

FilmtipsetExtension.Common.prototype.getIconFromGradeInfo = function(gradeInfo) {
    var iconUrl;
    if (!gradeInfo) {
        iconUrl = chrome.extension.getURL("images/pageactions/disabled.png");
    } else if (gradeInfo.type === "seen") {
        iconUrl = chrome.extension.getURL("images/pageactions/" + gradeInfo.grade + "seen.png");
    } else if (gradeInfo.type === "calculated") {
        iconUrl = chrome.extension.getURL("images/pageactions/" + gradeInfo.grade + "calculated.png");
    } else if (gradeInfo.type === "official") {
        iconUrl = chrome.extension.getURL("images/pageactions/" + gradeInfo.grade + "calculated.png");
    } else if (gradeInfo.type === "none") {
        iconUrl = chrome.extension.getURL("images/pageactions/unknown.png");
    } else {
        iconUrl = chrome.extension.getURL("images/pageactions/unknown.png"); // ???
    }
    return iconUrl;
};

FilmtipsetExtension.Common.prototype.getTitleFromGradeInfo = function(gradeInfo) {
    var title;
    if (!gradeInfo) {
        title = chrome.i18n.getMessage("pageActionTitleUnavailable");
    } else if (gradeInfo.type === "seen") {
        title = chrome.i18n.getMessage("pageActionTitleSeen").replace("%grade%", gradeInfo.grade);
    } else if (gradeInfo.type === "calculated") {
        title = chrome.i18n.getMessage("pageActionTitleCalculated").replace("%grade%", gradeInfo.grade);
    } else if (gradeInfo.type === "official") {
        title = chrome.i18n.getMessage("pageActionTitleUnknown");
    } else if (gradeInfo.type === "none") {
        title = chrome.i18n.getMessage("pageActionTitleUnknown");
    } else {
        title = chrome.i18n.getMessage("pageActionTitleUnknown");
    }
    return title;
};