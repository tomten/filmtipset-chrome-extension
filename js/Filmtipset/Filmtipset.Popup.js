"use strict";

/**
 * @constructor
 * @param {Object} jQuery Reference to jQuery. Used for DOM manipulation.
 */
FilmtipsetExtension.Popup = function (jQuery){
    this.jQuery = jQuery;
    };

/**
 * Returns true if any element in the array matches the supplied predicate function.
 * @param {function(*)} comparer Predicate function for matching an element.
 * @return {boolean} True if any element in the array matches the supplied predicate function.
 */
Array.prototype.any = function(comparer){
    var self = this;
    for (var elementIndex in self) {
        var element = self[elementIndex];
        var match = comparer(element);
        if (match)
            return true;
        }
    return false;
    };
    
/**
 * Draws the buttons in the popup.
 * @param {{ id: number }} tab Active tab.
 */
FilmtipsetExtension.Popup.prototype.showGradeButtons = function(tab) {
    var backgroundPage = chrome.extension.getBackgroundPage(); // HACK: Use sendMessage 
    var currentGradeInfo = backgroundPage.filmtipset.gradeForTab["tab" + tab.id];
    var popup = this;
    if (currentGradeInfo) {
        if (currentGradeInfo.grade) {
            var removeVoteDiv = this.jQuery(
                '<div class="voteimage ungrade"><img alt="x" src="' + chrome.extension.getURL('images/grade/nograde.png') + '" /></div>' // HACK: Use templating
                );
            this.jQuery("#vote").append(removeVoteDiv);
            removeVoteDiv.click(function(){ 
                popup.vote('0'); 
                backgroundPage.filmtipset.track("popup", "removeVote");
                });
        }
        for (var i = 1; i <= 5; i++) {
            var voteDiv;
            if (i == currentGradeInfo.grade) {
                voteDiv = this.jQuery(
                    '<div grade="%i%" class="voteimage grade"><img alt="%i%" src="%gradeImgUrl%" /></div>'
                        .replace('%i%', i.toString())
                        .replace(
                            '%gradeImgUrl%', 
                            chrome.extension.getURL(
                                'images/grade/%i%gradeactive.png'
                                    .replace('%i%', i.toString())
                                )
                            )
                    );
            }
            else {
                voteDiv = this.jQuery(
                    '<div grade="%i%" class="voteimage grade"><img alt="%i%" src="%gradeImgUrl%" /></div>'
                        .replace('%i%', i.toString())
                        .replace(
                            '%gradeImgUrl%', 
                            chrome.extension.getURL(
                                'images/grade/%i%grade.png'
                                    .replace('%i%', i.toString())
                                )
                            )
                    );
            }
            this.jQuery("#vote").append(voteDiv);
            voteDiv.click(function(){
                popup.voteFromDiv(this);
                backgroundPage.filmtipset.track("popup","vote");
            });
        }
        var wants = false;
        if (backgroundPage.filmtipset.wantedList) 
            wants = backgroundPage.filmtipset
                .wantedList
                .any(function(movie){ return currentGradeInfo.id == movie.movie.id; });
        if (!wants) {
            var wantedDiv = this.jQuery('<div id="want" class="i18n voteimage want"></div>');
            this.jQuery("#vote").append(wantedDiv);
            wantedDiv.click(function(){ 
                popup.want(); 
                backgroundPage.filmtipset.track("popup", "addToWantList");
                return false;
                });
            }
        }
        var filmtipsetDiv = this.jQuery('<div id="filmtipsetpage" class="i18n voteimage filmtipset"></div>');
        filmtipsetDiv.click(function(){
            backgroundPage.filmtipset.track("popup", "goToFilmtipsetPage");
            chrome.tabs.getSelected(
                null, 
                function(tab) {
                    var filmid = backgroundPage.filmtipset.gradeForTab["tab" + tab.id].id;
                    backgroundPage.filmtipset.hidePageActionForTab(
                        tab.id,
                        function(){}
                        );
                    backgroundPage.filmtipset.createAndSelectTab("http://filmtipset.se/" + filmid);
                    }
                );
            });
        this.jQuery("#vote").append(filmtipsetDiv);
        var jQuery = this.jQuery;
        this.jQuery(".i18n").each(
            function () {
                var $elm = jQuery(this);
                var messageName = $elm.attr("id");
                var html = chrome.i18n.getMessage(messageName);
                $elm.html(html);
                }
        );

    };

FilmtipsetExtension.Popup.prototype.voteFromDiv = function(div){
    var g = this.jQuery(div).attr("grade");
    this.vote(g); 
};

FilmtipsetExtension.Popup.prototype.want = function() {
    chrome.tabs.getSelected(
        null, 
        function(tab) {
            var backgroundPage = chrome.extension.getBackgroundPage(); // HACK
            backgroundPage.filmtipset.hidePageActionForTab(
                tab.id,
                function() {
                    var currentGradeInfo = backgroundPage.filmtipset.gradeForTab["tab" + tab.id];
                    var cache = backgroundPage.filmtipset.cache;
                    var film = new FilmtipsetExtension.FilmtipsetApi(
                        localStorage.accessKey, 
                        localStorage.userKey, 
                        cache,
                        null // no need for logger here
                        );
                    film.addToWantedListForFilmtipsetId(
                        currentGradeInfo.id, 
                        function() {
                            film.getWantedList(
                                function(getWantedListResult) {
                                    backgroundPage.filmtipset.wantedList = getWantedListResult;
                                    var gradeInfo = backgroundPage.filmtipset.gradeForTab["tab" + tab.id];
                                    var common = new FilmtipsetExtension.Common();
                                    var iconUrl = common.getIconFromGradeInfo(gradeInfo);
                                    var title = common.getTitleFromGradeInfo(gradeInfo);
                                    backgroundPage.filmtipset.showPageActionForTab(
                                        iconUrl, 
                                        title,
                                        tab.id, 
                                        function() {
                                            window.close();
                                        }
                                    );
                                }    
                            );
                        }
                    );
                }
            );
        }
    );
};

FilmtipsetExtension.Popup.prototype.vote = function(grade) {
    var backgroundPage = chrome.extension.getBackgroundPage(); // HACK
    backgroundPage.filmtipset.log("voting " + grade);
    var popup = this;
    chrome.tabs.getSelected(
        null, 
        function(tab) { popup.hideAndGrade(tab, grade); }
    );
};

FilmtipsetExtension.Popup.prototype.hideAndGrade = function(tab, grade) {
    var backgroundPage = chrome.extension.getBackgroundPage(); // HACK
    backgroundPage.filmtipset.log("voting " + grade + " for tab " + tab.id);
    this.doGrade(tab, grade);
};

FilmtipsetExtension.Popup.prototype.doGrade = function(tab, grade) {
    var backgroundPage = chrome.extension.getBackgroundPage(); // HACK
    backgroundPage.filmtipset.log("voting " + grade + " for tab " + tab.id);
    var currentGradeInfo = backgroundPage.filmtipset.gradeForTab["tab" + tab.id];
    var cache = backgroundPage.filmtipset.cache;
    var film = new FilmtipsetExtension.FilmtipsetApi(
        localStorage.accessKey, 
        localStorage.userKey, 
        cache,
        null // no need for logger here
        );
    backgroundPage.filmtipset.log("apigrading " + grade + " for id " + currentGradeInfo.id);
    var popup = this;
    film.gradeForFilmtipsetId(
        currentGradeInfo.id, 
        grade,  
        function(gradeResult) { popup.updatePageAction(gradeResult, tab, film); }
    );
};

FilmtipsetExtension.Popup.prototype.updatePageAction = function(gradeResult, tab, film) {
    var backgroundPage = chrome.extension.getBackgroundPage(); // HACK
    var gradeInfo = film.getGradeInfoMovie(gradeResult);
    backgroundPage.filmtipset.gradeForTab["tab" + tab.id] = gradeInfo;
    var common = new FilmtipsetExtension.Common();
    var iconUrl = common.getIconFromGradeInfo(gradeInfo);
    var title = common.getTitleFromGradeInfo(gradeInfo);
    backgroundPage.filmtipset.log("updating page action with '" + title + "' for tab " + tab.id);
    backgroundPage.filmtipset.showPageActionForTab(
        iconUrl, 
        title,
        tab.id, 
        function() { window.close(); } // HACK
    );
};