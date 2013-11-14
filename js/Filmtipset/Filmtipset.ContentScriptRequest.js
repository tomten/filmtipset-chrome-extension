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
 @param {string} fakeId Content script page request reference. 
 */
FilmtipsetExtension.ContentScriptRequest.ImdbData = function(
        imdbId,
        fakeId
        ){
    this.imdbId = imdbId;
    this.fakeId = fakeId;
    };
    