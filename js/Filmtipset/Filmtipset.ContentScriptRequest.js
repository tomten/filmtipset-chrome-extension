/**
 @constructor
 @param {string} reference Reference passed to original content script request.
 @param {string} gradeIconUrl Resulting grade icon URL for original content script request.
 @param {Object} movieInfo Movie info.
 */
FilmtipsetExtension.ContentScriptRequestCallback = function(
        reference, 
        gradeIconUrl,
        movieInfo
        ){
    this.reference = reference;
    this.gradeIconUrl = gradeIconUrl;
    this.movieInfo = movieInfo;
    };

/**
 @constructor
 @param {string} action Action.
 @param {FilmtipsetExtension.ContentScriptRequest.TrackData} trackData Data for tracking requests.
 @param {FilmtipsetExtension.ContentScriptRequest.ImdbData} imdbData Data for IMDB requests.
 */
FilmtipsetExtension.ContentScriptRequest = function(
        action, 
        trackData,
        imdbData
        ){
    this.action = action;
    this.trackData = trackData;
    this.imdbData = imdbData;
    };

/**
 @constructor
 @param {string} trackCategory Tracking category.
 @param {string} trackAction Tracking action.
 */
FilmtipsetExtension.ContentScriptRequest.TrackData = function(
        trackCategory, 
        trackAction
        ){
    this.trackCategory = trackCategory;
    this.trackAction = trackAction;
    };
    
/**
 @constructor
 @param {string} imdbId IMDB ID.
 @param {string} reference Content script page request reference. 
 */
FilmtipsetExtension.ContentScriptRequest.ImdbData = function(
        imdbId,
        reference
        ){
    this.imdbId = imdbId;
    this.reference = reference;
    };
    