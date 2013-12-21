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
 @param {string} imdbId IMDB ID.
 */
FilmtipsetExtension.ActivateImdbPageRequest = function(
        imdbId
        ){
    this.imdbId = imdbId;
    this.type = "FilmtipsetExtension.ActivateImdbPageRequest"; // used for deserialization of request
    };

/**
 @constructor
 @param {string} imdbId IMDB ID.
 @param {string} reference Reference for callback.
 */
FilmtipsetExtension.GradeForLinkRequest = function(
        imdbId,
        reference
        ){
    this.imdbId = imdbId;
    this.reference = reference;
    this.type = "FilmtipsetExtension.GradeForLinkRequest"; // used for deserialization of request
    };

/**
 @constructor
 @param {string} query Movie search query.
 @param {string} reference Reference for callback.
 */
FilmtipsetExtension.GradeForSearchRequest = function(
        query,
        reference
        ){
    this.query = query;
    this.reference = reference;
    this.type = "FilmtipsetExtension.GradeForSearchRequest"; // used for deserialization of request
    };

/**
 @constructor
 @param {string} category Tracking category.
 @param {string} action Tracking action.
 */
FilmtipsetExtension.TrackRequest = function(
        category,
        action
        ){
    this.category = category;
    this.action = action;
    this.type = "FilmtipsetExtension.TrackRequest"; // used for deserialization of request
    };
