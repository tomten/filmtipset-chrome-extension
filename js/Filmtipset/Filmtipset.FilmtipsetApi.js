"use strict";

/**
 * Filmtipset API client.
 * @constructor
 * @param {string} accessKey Application-specific access key for Filmtipset API.
 * @param {string} userKey User-specific user key for Filmtipset API.
 * @param {Object} cache Cache instance used by API. Must implement Monsur cache methods and properties.
 * @param {Function} logger Logging method.
*/
FilmtipsetExtension.FilmtipsetApi = function (
        accessKey, 
        userKey, 
        cache, 
        logger
        ) {        
    this.accessKey = accessKey;
    this.userKey = userKey;
    this.cache = cache;
    this.logger = logger;
    };

/**
 * Base URL for Filmtipset API.
 * @const
 * @type {string}
 */
FilmtipsetExtension.FilmtipsetApi.filmtipsetApiCgi = "http://www.filmtipset.se/api/api.cgi";

/**
 * URL template for getting movie info using its IMDB ID.
 * @const
 * @type {string}
 */
FilmtipsetExtension.FilmtipsetApi.url_template_imdb = "%filmtipsetApiCgi%?accesskey=%accessKey%&userkey=%userKey%&returntype=json&action=imdb&id=%imdbId%";

/**
 * URL template for getting movie infos using a title search string.
 * @const
 * @type {string}
 */
FilmtipsetExtension.FilmtipsetApi.url_template_search = "%filmtipsetApiCgi%?accesskey=%accessKey%&userkey=%userKey%&returntype=json&action=search&id=%query%";

/**
 * URL template for grading a movie using its Filmtipset ID.
 * @const
 * @type {string}
 */
FilmtipsetExtension.FilmtipsetApi.url_template_grade = "%filmtipsetApiCgi%?accesskey=%accessKey%&userkey=%userKey%&returntype=json&action=grade&id=%filmtipsetMovieId%&grade=%grade%";

/**
 * URL template for getting a user's want-to-see-list.
 * @const
 * @type {string}
 */
FilmtipsetExtension.FilmtipsetApi.url_template_get_wanted = "%filmtipsetApiCgi%?accesskey=%accessKey%&userkey=%userKey%&returntype=json&action=list&id=wantedlist";

/**
 * URL template for adding a movie to a user's want-to-see-list using its Filmtipset ID.
 * @const
 * @type {string}
 */
FilmtipsetExtension.FilmtipsetApi.url_template_add_to_wanted = "%filmtipsetApiCgi%?accesskey=%accessKey%&userkey=%userKey%&returntype=json&action=add-to-list&id=wantedlist&movie=%filmtipsetMovieId%";

/**
 * Validates a user-specific API User Key for the Filmtipset API by getting the user's want-to-see-list.
 * @param {string} userKeyToValidate User-specific API User Key to validate.
 * @param {function(boolean)} callback Function to run upon completion. 
 *     Input parameter to function will be whether validation succeeded.
 */
FilmtipsetExtension.FilmtipsetApi.prototype.validateUserKey = function(
        userKeyToValidate, 
        callback
        ) {
    var url = 
        FilmtipsetExtension.FilmtipsetApi.url_template_get_wanted
        .replace("%filmtipsetApiCgi%", FilmtipsetExtension.FilmtipsetApi.filmtipsetApiCgi)
        .replace("%accessKey%", this.accessKey)
        .replace("%userKey%", this.userKey);
    this.xmlHttpRequest(
        url, 
        function(getWantedListResponse){
            var userKeyWasValid = 
                getWantedListResponse[0] &&
                getWantedListResponse[0].user && 
                getWantedListResponse[0].user.id; 
            callback(userKeyWasValid);
            }
        );
    };

/**
 * Gets a user's want-to-see-list.
 * @param {function(Array)} callback Function to run upon completion. 
 *     Input parameter to function will be array of Filmtipset Movies 
 *     with user's wanted list.
 */
FilmtipsetExtension.FilmtipsetApi.prototype.getWantedList = function(callback) {
    var url = 
        FilmtipsetExtension.FilmtipsetApi.url_template_get_wanted
        .replace("%filmtipsetApiCgi%", FilmtipsetExtension.FilmtipsetApi.filmtipsetApiCgi)
        .replace("%accessKey%", this.accessKey)
        .replace("%userKey%", this.userKey)
        ;
    this.xmlHttpRequest(
        url, 
        function(getWantedResponse){
            callback(
                getWantedResponse
                    [0] // Response array only has one element
                    .data // .data contains the Wanted List, the rest is metadata (.request, .user etc)
                    [0] // Data array only has one element
                    .movies // .movies contains the Filmtipset Movies, the rest is metadata (.count, .title etc)
                    .select(function(x){ // Project a new array from the Filmtipset Movie array
                        return x.movie; // Each Filmtipset Movie has all its data in .movie
                        })
                );
            } 
        );
    };

/**
 * Adds a movie to a user's want-to-see-list.
 * @param {string} filmtipsetMovieId Filmtipset ID of movie to add. 
 * @param {function(Array)} callback Function to run upon completion. 
 *     Input parameter to function will be new wanted list array.
 */
FilmtipsetExtension.FilmtipsetApi.prototype.addToWantedListForFilmtipsetId = function(
        filmtipsetMovieId, 
        callback
        ) {
    var url = 
        FilmtipsetExtension.FilmtipsetApi.url_template_add_to_wanted
        .replace("%filmtipsetApiCgi%", FilmtipsetExtension.FilmtipsetApi.filmtipsetApiCgi)
        .replace("%accessKey%", this.accessKey)
        .replace("%userKey%", this.userKey)
        .replace("%filmtipsetMovieId%", filmtipsetMovieId)
        ;
    this.xmlHttpRequest(
        url, 
        function(addToWantedResponse){
            callback(
                addToWantedResponse
                    [0] // Response array only has one element
                    .data // .data contains the Wanted List, the rest is metadata (.request, .user etc)
                    [0] // Data array only has one element
                    .movies // .movies contains the Filmtipset Movies, the rest is metadata (.count, .title etc)
                    .select(function(x){ // Project a new array from the Filmtipset Movie array
                        return x.movie; // Each Filmtipset Movie has all its data in .movie
                        })
                );
            }
        );
    };

/**
 * Grades a movie for a user.
 * @param {string} imdbId IMDB ID of movie. 
 * @param {number} grade Grade. 0 for "no grade" or 1-5 for grades. 
 * @param {function(Object)} callback Function to run upon completion. 
 *     Input parameter to function will be updated Filmtipset Movie info,
 *     or null on error.
 */
FilmtipsetExtension.FilmtipsetApi.prototype.gradeForImdbId = function(
        imdbId, 
        grade, 
        callback
        ) {
    this.getInfoForImdbId( // First, get the Filmtipset ID for this movie.
        imdbId,
        function(movieInfo) {
            var gradeInfo = this.getGradeInfo(movieInfo); 
            if (gradeInfo) {
                this.gradeForFilmtipsetId(
                    gradeInfo.id, 
                    grade, 
                    function(updatedMovieResponse){
                        callback(updatedMovieResponse);
                        }
                    );
                }
            else {
                callback(null);
                }
            }
        );
    };    

/**
 * Grades a movie for a user.
 * @param {string} filmtipsetMovieId Filmtipset ID of movie. 
 * @param {number} grade Grade. 0 for "no grade" or 1-5 for grades. 
 * @param {function(Object)} callback Function to run upon completion. 
 *     Input parameter to function will be updated Filmtipset Movie info,
 *     or null on error.
 */
FilmtipsetExtension.FilmtipsetApi.prototype.gradeForFilmtipsetId = function(
        filmtipsetMovieId, 
        grade, 
        callback
        ) {
    // Clear the cache since we're changing the Filmtipset info.
    this.cache.clear(); // HACK: Should not clear everything (eg. search results) here
    var url = 
        FilmtipsetExtension.FilmtipsetApi.url_template_grade
        .replace("%filmtipsetApiCgi%", FilmtipsetExtension.FilmtipsetApi.filmtipsetApiCgi)
        .replace("%grade%", grade.toString())
        .replace("%filmtipsetMovieId%", filmtipsetMovieId)
        .replace("%accessKey%", this.accessKey)
        .replace("%userKey%", this.userKey)
        ;
    this.xmlHttpRequest(
        url, 
        function(updatedMovieResponse) { 
            callback(updatedMovieResponse[0].data[0].movie); 
            }
        );
    };

/**
 * Find movies whose titles match a query.
 * @param {string} query Query to search for. 
 * @param {function(Array)} callback Function to run upon completion. 
 *     Input parameter to function will be array of Filmtipset Movies.
 */
FilmtipsetExtension.FilmtipsetApi.prototype.search = function(
        query, 
        callback
        ) {
    var key = "search" + query;
    var cachedSearch = this.cache.getItem(key);
    if (cachedSearch) {
        callback(cachedSearch);
        return;
    }
    var url = 
        FilmtipsetExtension.FilmtipsetApi.url_template_search
        .replace("%filmtipsetApiCgi%", FilmtipsetExtension.FilmtipsetApi.filmtipsetApiCgi)
        .replace("%query%", query)
        .replace("%accessKey%", this.accessKey)
        .replace("%userKey%", this.userKey)
        ;
    var cache = this.cache;
    this.xmlHttpRequest(
        url, 
        function(searchResponse) {
            var hits = 
                searchResponse[0]
                .data[0]
                .hits
                .select(function(hit){
                    return hit.movie;
                    });
            cache.setItem(
                key, 
                hits, 
                { expirationAbsolute: (new Date()).addDays(3) } // Save search results for 3 days
                ); 
            callback(hits);
            }                 
        );
    };

/**
 Add a number of days to a Date.
 @param {number} days Number of days to add to Date.
 @return {Date} Date with days added.
 */
Date.prototype.addDays = function(days)
{
    var dat = new Date(this.valueOf());
    dat.setDate(dat.getDate() + days);
    return dat;
};    

/**
 * Returns all elements matching a predicate.
 * @param {function(?):boolean} predicate Predicate function. 
 *     Input parameter will be element under test. 
 * @return {Array} Reduced array.
 */
Array.prototype.where = function(predicate){
    var ret = [];
    this.forEach(
        /**
         @param {?} x Element under test.
         */
        function(x){
            if (predicate(x) === true) {
                ret.push(x);
                }
            }
        );
    return ret;
    };

/**
 Projects elements in an array onto a new array using a projector function.
 @param {function(?):?} projector Projector function. 
     Input parameter is element in array.
 @return {Array} Projected array. 
 */
Array.prototype.select = function(projector){
    var ret = [];
    this.forEach(
        /**
         @param {?} x Element to project.
         */
        function(x){
            ret.push(projector(x));
            }
        );
    return ret;
    };
    
/**
 * Find movies whose original or Swedish titles exactly match a query.
 * @param {string} query Query to search for. 
 * @param {function(Array)} callback Function to run upon completion. 
 *     Input parameter to function will be array of Filmtipset Movies.
 */
FilmtipsetExtension.FilmtipsetApi.prototype.searchExact = function(
        query, 
        callback
        ) {
    this.search(
        query, 
        function(results){
            var exactResults = results.where(function(result){
                var isExactResult = 
                    result.orgname == query ||
                    result.name == query; // TODO: Search alt_title.split(',') as well?                       
                return isExactResult;
                });
            callback(exactResults);
            }
        );
    };

/**
 Gets movie info.
 @param {string} imdbId IMDB ID.
 @param {function(Object)} callback Function to run with Filmtipset Movie result.
 */    
FilmtipsetExtension.FilmtipsetApi.prototype.getInfoForImdbId = function(
        imdbId, 
        callback
        ) {
    var key = "getInfoForImdbId" + imdbId;
    var cachedInfoForImdbId = this.cache.getItem(key);
    if (cachedInfoForImdbId) {
        // We already had Filmtipset info for this IMDB ID in the cache
        callback(cachedInfoForImdbId);
        return;
    }
    var url = 
        FilmtipsetExtension.FilmtipsetApi.url_template_imdb
        .replace("%filmtipsetApiCgi%", FilmtipsetExtension.FilmtipsetApi.filmtipsetApiCgi)
        .replace("%imdbId%", imdbId)
        .replace("%accessKey%", this.accessKey)
        .replace("%userKey%", this.userKey)
        ;
    var cache = this.cache;
    this.xmlHttpRequest(
        url, 
        function(response) {
            if (!response || response.length === 0 || !response[0] || !response[0].data || response[0].data.length === 0 || !response[0].data[0]){
                cache.setItem(
                    key, 
                    { fake: true } // HACK: NULL should be cached, not a fake object
                    );
                callback(null);
                return;
                }
            var data = response[0].data[0].movie;
            cache.setItem(
                key, 
                data,
                { expirationAbsolute: (new Date()).addDays(7) } // Save Filmtipset movie info for a week
                );
            callback(data);
            return;
            }                 
        );
    };

/**
 * Determines the grade and grade type for a Filmtipset Movie Info Response.
 * @param {?} json Filmtipset Movie Info Response
 * @return {(FilmtipsetExtension.GradeInfo|null)} Object with .grade, .type and .id for movie. 
 *     Or null on error.
 */
FilmtipsetExtension.FilmtipsetApi.prototype.getGradeInfo = function(json) {
    if (
        json && 
        json[0] && 
        json[0].data && 
        json[0].data.length > 0
        ) {
        if (json[0].data[0].movie) {
            return this.getGradeInfoMovie(json[0].data[0].movie);
            } 
            else {
                // No movie (bad response?)
            }
        } else {
            // Unknown movie (or bad response)
        }
    return null;
    };

/**
 * Determines the grade and grade type for a Filmtipset Movie.
 * @param {?} movie Filmtipset Movie 
 * @return {(FilmtipsetExtension.GradeInfo|null)} Object with .grade, .type and .id for movie.
 *     Or null on error.
 */
FilmtipsetExtension.FilmtipsetApi.prototype.getGradeInfoMovie = function(movie) { 
    if (!movie) {
        return null;
        }
    var id = movie.id; // undefined, "1234"
    if (id) {
        var grade = movie.grade;
        if (grade) {
            var gradevalue = grade.value; // null, "1", "2", "3", "4", "5"
            var gradetype = grade.type; // "none", "seen", "calculated"
            var gradeAndType = 
            {
                "grade": gradevalue,
                "type": gradetype,
                "id": id
            };
            return gradeAndType;
            } 
            else {
                // No grade available
            }
        } 
        else {
            // Unknown movie
        }
    return null;
    };

/**
 * GETs an URL.
 * @param {string} url Request URL. 
 * @param {function(*)} callback Function to call upon completion. 
 *     Input parameter will be response for request to URL, or null upon any error. 
 */
FilmtipsetExtension.FilmtipsetApi.prototype.xmlHttpRequest = function(
        url, 
        callback
        ) {
    var req = new XMLHttpRequest();
    req.addEventListener("load", function(){
        if (req.status === 200) {
            callback(JSON.parse(req.responseText));
            } 
        else { callback(null); }
        });
    req.addEventListener("error", function(){ callback(null); });
    req.open("get", url, true);
    if (this.logger) this.logger("fetching " + url);
    req.send();            
    };        
