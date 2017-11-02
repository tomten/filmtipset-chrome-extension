"use strict";

/**
 * @constructor
 * @param {Object} jQuery Reference to jQuery. Used for DOM manipulation.
 */
FilmtipsetExtension.Popup = function (jQuery){
    this.jQuery = jQuery;
    };
    
/**
 * Draws the buttons in the popup.
 * @param {{ id: number }} tab Active tab.
 */
FilmtipsetExtension.Popup.prototype.showGradeButtons = function(tab) {
    var popup = this;
    chrome.runtime.getBackgroundPage(function(backgroundPage){  
        var currentGradeInfo = backgroundPage.hosten.gradeForTab["tab" + tab.id];
        if (currentGradeInfo) {
            if (currentGradeInfo.grade) {
                var removeVoteDiv = popup.jQuery(
                    '<div class="voteimage ungrade"><a title="Ta bort betyg"><img alt="Ta bort betyg" src="' + chrome.extension.getURL('images/grade/nograde.png') + '" /></a></div>' // HACK: Use templating
                    );
                    popup.jQuery("#vote").append(removeVoteDiv);
                removeVoteDiv.click(function(){ 
                    popup.vote('0'); 
                    backgroundPage.hosten.track("popup", "removeVote");
                    });
            }
            for (var i = 1; i <= 5; i++) {
                var voteDiv;
                if (i == currentGradeInfo.grade) {
                    voteDiv = popup.jQuery(
                        '<div grade="%i%" class="voteimage grade"><a title="Betygsätt %i%"><img alt="%i%" src="%gradeImgUrl%" /></a></div>'
                            .replace(/%i%/g, i.toString())
                            .replace(
                                '%gradeImgUrl%', 
                                chrome.extension.getURL(
                                    'images/grade/%i%gradeactive.png'
                                        .replace(/%i%/g, i.toString())
                                    )
                                )
                        );
                }
                else {
                    voteDiv = popup.jQuery(
                        '<div grade="%i%" class="voteimage grade"><img alt="%i%" src="%gradeImgUrl%" /></div>'
                            .replace(/%i%/g, i.toString())
                            .replace(
                                '%gradeImgUrl%', 
                                chrome.extension.getURL(
                                    'images/grade/%i%grade.png'
                                        .replace(/%i%/g, i.toString())
                                    )
                                )
                        );
                }
                popup.jQuery("#vote").append(voteDiv);
                voteDiv.click(function(){
                    popup.voteFromDiv(this);
                    backgroundPage.hosten.track("popup","vote");
                });
            }
            var wants = false;
            if (backgroundPage.hosten.wantedList) 
                wants = backgroundPage
                    .hosten
                    .wantedList
                    .some(function(movie){ 
                        return currentGradeInfo.id == movie.id; 
                    });
            if (!wants) {
                var wantedDiv = popup.jQuery('<a title="Vill se"><div id="want" class="i18n voteimage want"></div></a>');
                popup.jQuery("#vote").append(wantedDiv);
                wantedDiv.click(function(){ 
                    popup.want(); 
                    backgroundPage.hosten.track("popup", "addToWantList");
                    return false;
                    });
                }
            }
            var filmtipsetDiv = popup.jQuery('<a title="Filmtipsetsida"><div id="filmtipsetpage" class="i18n voteimage filmtipset"></div></a>');
            popup.jQuery("#vote").append(filmtipsetDiv);
            filmtipsetDiv.click(function(){
                backgroundPage.hosten.track("popup", "goToFilmtipsetPage");
                chrome.tabs.getSelected(
                    null, 
                    function(tab) {
                        var filmid = backgroundPage.hosten.gradeForTab["tab" + tab.id].id;
                        backgroundPage.hosten.hidePageActionForTab(
                            tab.id,
                            function(){}
                            );
                        backgroundPage.hosten.createAndSelectTab("http://filmtipset.se/" + filmid);
                        }
                    );
                });
            popup.jQuery(".i18n").each(
                function () {
                    var $elm = popup.jQuery(this);
                    var messageName = $elm.attr("id");
                    var html = chrome.i18n.getMessage(messageName);
                    $elm.html(html);
                    }
            );
        });
    };

FilmtipsetExtension.Popup.prototype.voteFromDiv = function(div){
    var g = this.jQuery(div).attr("grade");
    this.vote(g); 
};

FilmtipsetExtension.Popup.prototype.want = function() {
    chrome.tabs.getSelected(
        null, 
        function(tab) {
            chrome.runtime.getBackgroundPage(function(backgroundPage){ 
                backgroundPage.hosten.hidePageActionForTab(
                    tab.id,
                    function() {
                        var currentGradeInfo = backgroundPage.hosten.gradeForTab["tab" + tab.id];
                        var cache = backgroundPage.hosten.cache;
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
                                        backgroundPage.hosten.wantedList = getWantedListResult;
                                        var gradeInfo = backgroundPage.hosten.gradeForTab["tab" + tab.id];
                                        var common = new FilmtipsetExtension.Common();
                                        var iconUrl = common.getIconFromGradeInfo(gradeInfo);
                                        var title = common.getTitleFromGradeInfo(gradeInfo);
                                        backgroundPage.hosten.showPageActionForTab(
                                            iconUrl, 
                                            title,
                                            tab.id, 
                                            function() {
                                                window.close(); // HACK?
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
    });
};

FilmtipsetExtension.Popup.prototype.vote = function(grade) {
    var popup = this;
    chrome.tabs.getSelected(
        null, 
        function(tab) { popup.hideAndGrade(tab, grade); }
    );
};

FilmtipsetExtension.Popup.prototype.hideAndGrade = function(tab, grade) {
    this.doGrade(tab, grade);
};

FilmtipsetExtension.Popup.prototype.doGrade = function(tab, grade) {
    var popup = this;
    chrome.runtime.getBackgroundPage(function(backgroundPage){ 
        var currentGradeInfo = backgroundPage.hosten.gradeForTab["tab" + tab.id];
        var cache = backgroundPage.hosten.cache;
        var film = new FilmtipsetExtension.FilmtipsetApi(
            localStorage.accessKey, 
            localStorage.userKey, 
            cache,
            null // no need for logger here
            );
        film.gradeForFilmtipsetId(
            currentGradeInfo.id, 
            grade,  
            function(gradeResult) { popup.updatePageAction(gradeResult, tab, film); }
        );
    });
};

FilmtipsetExtension.Popup.prototype.updatePageAction = function(gradeResult, tab, film) {
    var gradeInfo = film.getGradeInfoMovie(gradeResult);
    chrome.runtime.getBackgroundPage(function(backgroundPage){ 
        backgroundPage.hosten.gradeForTab["tab" + tab.id] = gradeInfo;
        var common = new FilmtipsetExtension.Common();
        var iconUrl = common.getIconFromGradeInfo(gradeInfo);
        var title = common.getTitleFromGradeInfo(gradeInfo);
        backgroundPage.hosten.showPageActionForTab(
            iconUrl, 
            title,
            tab.id, 
            function() { window.close(); } // HACK
        );
    });
};
