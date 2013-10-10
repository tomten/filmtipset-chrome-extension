"use strict";

/**
 * @constructor
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
    }

FilmtipsetExtension.FilmtipsetApi.filmtipsetApiCgi = "http://www.filmtipset.se/api/api.cgi";
FilmtipsetExtension.FilmtipsetApi.url_template_imdb = "%filmtipsetApiCgi%?accesskey=%accessKey%&userkey=%userKey%&returntype=json&action=imdb&id=%imdbId%";
FilmtipsetExtension.FilmtipsetApi.url_template_grade = "%filmtipsetApiCgi%?accesskey=%accessKey%&userkey=%userKey%&returntype=json&action=grade&id=%filmtipsetMovieId%&grade=%grade%";
FilmtipsetExtension.FilmtipsetApi.url_template_get_wanted = "%filmtipsetApiCgi%?accesskey=%accessKey%&userkey=%userKey%&returntype=json&action=list&id=wantedlist";
FilmtipsetExtension.FilmtipsetApi.url_template_add_to_wanted = "%filmtipsetApiCgi%?accesskey=%accessKey%&userkey=%userKey%&returntype=json&action=add-to-list&id=wantedlist&movie=%filmtipsetMovieId%";
    
FilmtipsetExtension.FilmtipsetApi.prototype.validateUserKey = function(
        userKeyToValidate, 
        callback
        ) {
        var result = this.getWantedList(function(data){
            console.log(data[0].data[0].description);
            var userKeyWasValid = !(data[0].data[0].description === "Filmer som  vill se"); // HACK
            console.log(userKeyWasValid);
            callback(userKeyWasValid);
            });
    }

FilmtipsetExtension.FilmtipsetApi.prototype.getWantedList = function(callback) {
    var url = 
        FilmtipsetExtension.FilmtipsetApi.url_template_get_wanted
        .replace("%filmtipsetApiCgi%", FilmtipsetExtension.FilmtipsetApi.filmtipsetApiCgi)
        .replace("%accessKey%", this.accessKey)
        .replace("%userKey%", this.userKey)
        ;
    this.xmlHttpRequest(
        url, 
        callback, 
        true,
        this.logger
        );
    };

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
        callback, 
        true,
        this.logger
        );
    };

FilmtipsetExtension.FilmtipsetApi.prototype.gradeForImdbId = function(
        imdbId, 
        grade, 
        callback
        ) {
    this.getInfoForImdbId(
        imdbId,
        function(movieInfo) {
            var gradeInfo = this.getGradeInfo(movieInfo); 
            if (gradeInfo) {
                this.gradeForFilmtipsetId(
                    gradeInfo.id, 
                    grade, 
                    callback
                    );
                }
            else {
                callback(null);
                }
            }
        );
    };    

FilmtipsetExtension.FilmtipsetApi.prototype.gradeForFilmtipsetId = function(
        filmtipsetMovieId, 
        grade, 
        callback
        ) {
    // Clear the cache since we're changing the Filmtipset info.
    this.cache.clear();
    var url = 
        FilmtipsetExtension.FilmtipsetApi.url_template_grade
        .replace("%filmtipsetApiCgi%", FilmtipsetExtension.FilmtipsetApi.filmtipsetApiCgi)
        .replace("%grade%", grade)
        .replace("%filmtipsetMovieId%", filmtipsetMovieId)
        .replace("%accessKey%", this.accessKey)
        .replace("%userKey%", this.userKey)
        ;
    this.xmlHttpRequest(
        url, 
        function(data) { callback(data); }, 
        true,
        this.logger
        );
    };

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
        function(data) {
            // Cache this Filmtipset info for this IMDB ID
            cache.setItem(key, data);
            callback(data);
            },                 
        true,
        this.logger
        );
    };

FilmtipsetExtension.FilmtipsetApi.prototype.getGradeInfo = function(json) {
    if (
        json && 
        json[0] && 
        json[0].data && 
        json[0].data.length > 0
        ) {
        if (json[0].data[0].movie) {
            var id = json[0].data[0].movie.id; // undefined, "1234"
            if (id) {
                var grade = json[0].data[0].movie.grade;
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
                    } else {
                        // No grade available
                    }
                } else {
                    // Unknown movie
                }
            } else {
                // No movie (bad response?)
            }
        } else {
            // Unknown movie (or bad response)
        }
    return null;
    };

FilmtipsetExtension.FilmtipsetApi.prototype.xmlHttpRequest = function(
        url, 
        callback, 
        json, 
        logger
        ) {
    var req = new XMLHttpRequest();
    req.onload = function() {
        if (req.readyState === 4) {
            if (req.status === 200) {
                if (json) {
                    callback(JSON.parse(req.responseText));
                    }
                else {
                    callback(req.responseText);
                    }
                } 
            else {
                callback(null);
                }
            }
        else {
            callback(null);
            }
        };
    req.onerror = function() {
        callback(null);
        };
    req.open("GET", url, true);
    req.send();            
    };        
