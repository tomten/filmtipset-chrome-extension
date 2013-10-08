"use strict";

// constructor
function Popup(jQuery){
	this.jQuery = jQuery;
	}

Popup.prototype.showGradeButtons = function(tab) {
	var backgroundPage = chrome.extension.getBackgroundPage(); // HACK
	var currentGradeInfo = backgroundPage.filmtipset.gradeForTab["tab" + tab.id];
	var popup = this;
	if (currentGradeInfo) {
		if (currentGradeInfo.grade) {
			var removeVoteDiv = this.jQuery('<div class="voteimage ungrade"><img alt="x" src="images/grade/nograde.png" /></div>');
			this.jQuery("#vote").append(removeVoteDiv);
			removeVoteDiv.click(function(){ 
                popup.vote('0'); 
                backgroundPage.filmtipset.track("popup", "removeVote");
                });
		}
		for (var i = 1; i <= 5; i++) {
			var voteDiv;
			if (i == currentGradeInfo.grade) {
				voteDiv = this.jQuery('<div grade="' + i + '" class="voteimage grade"><img alt="' + i + '" src="images/grade/' + i + 'gradeactive.png" /></div>');
			}
			else {
				voteDiv = this.jQuery('<div grade="' + i + '" class="voteimage grade"><img alt="' + i + '" src="images/grade/' + i + 'grade.png" /></div>');
			}
			this.jQuery("#vote").append(voteDiv);
			voteDiv.click(function(){
				popup.voteFromDiv(this);
                backgroundPage.filmtipset.track("popup","vote");
			});
		}
		var wants = false;
		if (backgroundPage.filmtipset.wantedList) {
			for (var wantedMovie in backgroundPage.filmtipset.wantedList) {
				var wantedImdb = backgroundPage.filmtipset.wantedList[wantedMovie].movie.id;
				if (wantedImdb == currentGradeInfo.id) 
					wants = true; // TODO: better "find element in array" mechanism?
					}
			}
		if (!wants) {
			var wantedDiv = this.jQuery('<div id="want" class="voteimage want">Vill se</div>');
			this.jQuery("#vote").append(wantedDiv);
			wantedDiv.click(function(){ 
                popup.want(); 
                backgroundPage.filmtipset.track("popup", "addToWantList");
				return false;
                });
			}
		}
		var filmtipsetDiv = this.jQuery('<div id="filmtipsetpage" class="voteimage filmtipset">Filmtipset</div>');
		filmtipsetDiv.click(function(){
			chrome.tabs.getSelected(
				null, 
				function(tab) {
					var backgroundPage = chrome.extension.getBackgroundPage(); // HACK
					backgroundPage.filmtipset.hidePageActionForTab(
						tab.id,
						function() {
							window.close();
							}
						);
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

Popup.prototype.voteFromDiv = function(div){
	var g = this.jQuery(div).attr("grade");
	this.vote(g); 
};

Popup.prototype.want = function() {
	chrome.tabs.getSelected(
		null, 
		function(tab) {
			var backgroundPage = chrome.extension.getBackgroundPage(); // HACK
			backgroundPage.filmtipset.hidePageActionForTab(
				tab.id,
				function() {
					var currentGradeInfo = backgroundPage.filmtipset.gradeForTab["tab" + tab.id];
					var cache = backgroundPage.filmtipset.cache;
					var film = new FilmtipsetApi(
						localStorage.accessKey, 
						localStorage.userKey, 
						cache
						);
					film.addToWantedListForFilmtipsetId(
						currentGradeInfo.id, 
						function() {
							film.getWantedList(
								function(getWantedListResult) {
									backgroundPage.filmtipset.wantedList = getWantedListResult[0].data[0].movies;
									var gradeInfo = backgroundPage.filmtipset.gradeForTab["tab" + tab.id];
									var common = new Common();
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

Popup.prototype.vote = function(grade) {
	var backgroundPage = chrome.extension.getBackgroundPage(); // HACK
	backgroundPage.filmtipset.log("voting " + grade);
	var popup = this;
	chrome.tabs.getSelected(
		null, 
		function(tab) { popup.hideAndGrade(tab, grade); }
	);
};

Popup.prototype.hideAndGrade = function(tab, grade) {
	var backgroundPage = chrome.extension.getBackgroundPage(); // HACK
	backgroundPage.filmtipset.log("voting " + grade + " for tab " + tab.id);
	this.doGrade(tab, grade);
};

Popup.prototype.doGrade = function(tab, grade) {
	var backgroundPage = chrome.extension.getBackgroundPage(); // HACK
	backgroundPage.filmtipset.log("voting " + grade + " for tab " + tab.id);
	var currentGradeInfo = backgroundPage.filmtipset.gradeForTab["tab" + tab.id];
	var cache = backgroundPage.filmtipset.cache;
	var film = new FilmtipsetApi(
		localStorage.accessKey, 
		localStorage.userKey, 
		cache);
	backgroundPage.filmtipset.log("apigrading " + grade + " for id " + currentGradeInfo.id);
	var popup = this;
	film.gradeForFilmtipsetId(
		currentGradeInfo.id, 
		grade,  
		function(gradeResult) { popup.updatePageAction(gradeResult, tab, film); }
	);
};

Popup.prototype.updatePageAction = function(gradeResult, tab, film) {
	var backgroundPage = chrome.extension.getBackgroundPage(); // HACK
	var gradeInfo = film.getGradeInfo(gradeResult);
	backgroundPage.filmtipset.gradeForTab["tab" + tab.id] = gradeInfo;
	var common = new Common();
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

// Show grade buttons for the selected tab.
chrome.tabs.getSelected(
	null, 
	function(selectedTab) { 
		var popup = new Popup($);
		popup.showGradeButtons(selectedTab); });
