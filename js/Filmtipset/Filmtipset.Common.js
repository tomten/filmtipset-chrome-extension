"use strict";

/**
 * @constructor
 */
FilmtipsetExtension.Common = function (){};

/**
 * Extracts the IMDB ID from an IMDB URL.
 * @param {string} url IMDB URL.
 * @return {string|null} IMDB ID, or null.
 */
FilmtipsetExtension.Common.prototype.getImdbIdFromUrl = function(url) {
    var re = /\/tt(\d+)\D/i;
    var match = url.match(re);
    if (match) {
        if (match.length === 2) {
            var imdbId = match[1];
            if (imdbId.length === 5)
                imdbId = '00' + imdbId; // HACK
            else if (imdbId.length === 6)
                imdbId = '0' + imdbId; // HACK
            return imdbId;
        }
    }
    return null;
};

/**
 * Log.
 * @param {string} message Message.
 */
FilmtipsetExtension.Common.prototype.log = function(message) {
    chrome.extension.getBackgroundPage().log(message); 
}; 

/**
 * Determines the grade icon URL for a Grade Info.
 * @param {FilmtipsetExtension.GradeInfo} gradeInfo Grade Info.
 * @return {string} Grade icon URL.
 */
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

/**
 * Determines the proper page action title for a Grade Info.
 * @param {FilmtipsetExtension.GradeInfo} gradeInfo Grade Info.
 * @return {string} Page action title.
 */
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







/**
 @constructor
 @param {string} type Grade type ("seen", ...).
 @param {number} grade Grade value (0-5).
 */
FilmtipsetExtension.GradeInfo = function(
        type, 
        grade
        ){
    this.type = type;
    this.grade = grade;
    };

