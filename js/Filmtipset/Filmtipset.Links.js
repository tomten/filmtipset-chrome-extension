"use strict";

/**
 * @constructor
 */
FilmtipsetExtension.Links = function (jQuery){
    this.jQuery = jQuery;
    this.$links = [];
    this.linkProcessingPort = null;
    this.running = false;
	};

/** @const */
FilmtipsetExtension.Links.image_html_template = '<img hidden style="position:absolute;" width="20" height="20" src="%grade%" />';    

/** @const */
FilmtipsetExtension.Links.jquery_imdb_link_selector = 'a:regex(href, (www\\.)?imdb\\.(.+)\\/tt(\\d+)\\/?)';    

/** @const */
FilmtipsetExtension.Links.jquery_imdb_link_selector_on_imdb = 'a:regex(href, ^\\/title\\/tt(\\d+)\\/?$)';    

/** @const */
FilmtipsetExtension.Links.jquery_imdb_link_selector_on_google_movies = '.showtimes .movie > .name > a';    

/** @const */
FilmtipsetExtension.Links.popover_html_template = '<a style="float:right;" href="%url%"><img style="padding-left:10px;" src="%imgUrl%" /></a>%title%<br/><br/>%description%<br style="clear:both;" clear="both" />';

/** @const */
FilmtipsetExtension.Links.progress_html = 
    '<div hidden id="filmtipsetImdbLinks" style="background-image: url(%remsaUrl%);">'+
        chrome.i18n.getMessage('progressHtml') +
    '</div>';

/** Filmtipsifies movie links on Google Movies */    
FilmtipsetExtension.Links.prototype.processLinksOnGoogleMovies = function(){
    this.processLinksInternal(FilmtipsetExtension.Links.jquery_imdb_link_selector_on_google_movies);
    };

/** Filmtipsifies internal IMDB links on IMDB */    
FilmtipsetExtension.Links.prototype.processLinksOnImdb = function(){
    // TODO: Doesn't seem to work for all links?
    this.processLinksInternal(FilmtipsetExtension.Links.jquery_imdb_link_selector_on_imdb);
    };

/** Filmtipsifies IMDB links on any normal site */    
FilmtipsetExtension.Links.prototype.processLinks = function(){
    this.processLinksInternal(FilmtipsetExtension.Links.jquery_imdb_link_selector);
    };

/** 
 * Handles responses from the event page 
 * @param {FilmtipsetExtension.ContentScriptRequestCallback} contentScriptRequestCallback Response from event page.
 */    
FilmtipsetExtension.Links.prototype.handleResponse = function(contentScriptRequestCallback) {
    var reference = parseint(contentScriptRequestCallback.reference, 10);
    var gradeUrl = contentScriptRequestCallback.gradeIconUrl;
    var movieInfo = contentScriptRequestCallback.movieInfo;
    var $link = this.jQuery(this.$links[reference]); 
    $link.attr("filmtipsified", "true");
	if (
        movieInfo &&
        movieInfo.name
        )
        $link.tipTip({ 
            delay: 1, 
            maxWidth: "300px",
            fadeIn: 100, 
            fadeOut: 400, 
            edgeOffset: 0,
            keepAlive: true,
            content: 
                FilmtipsetExtension.Links.popover_html_template
                    .replace("%description%", movieInfo.description || "")
                    .replace("%title%", movieInfo.name)
                    .replace("%imgUrl%", movieInfo.image)
                    .replace("%url%", movieInfo.url)
            });
    var $gradeImage = this.jQuery(FilmtipsetExtension.Links.image_html_template.replace("%grade%", gradeUrl));
    //$gradeImage.hide();
    $link.append($gradeImage);
    $gradeImage.fadeIn(200); 
    if (reference >= this.$links.length - 1) { // HACK: Should be == something
		this.running = false;
        this.jQuery("#filmtipsetImdbLinks").stop().slideUp(500, "linear", function(){});
        this.linkProcessingPort.disconnect();
        }
    else {
        var $linkCount = this.jQuery("#filmLinkCount");
        var linksLeft = parseInt($linkCount.html(), 10);
        linksLeft--;
        $linkCount.html(linksLeft);
        var self = this;
        window.setTimeout( 
            function(){
                self.processOneLink(parseInt(reference, 10) + 1);
                }, 
            1
            );
        }
    };    
    
/** 
 Filmtipsifies links using the specified link selector
 @param {string} link_selector jQuery link selector
 @private 
 */
FilmtipsetExtension.Links.prototype.processLinksInternal = function(link_selector){
	var self = this;
	if (this.running) 
		return;
    this.running = true;
	this.$links = this.jQuery(link_selector).not('[filmtipsified]'); // collect all unprocessed links to follow
    if (this.$links.length > 0) { // are there any links to follow?
        this.linkProcessingPort = chrome.runtime.connect(); // setup the port used to communicate with the event page
        this.linkProcessingPort.onMessage.addListener(
            /**
             * @param {FilmtipsetExtension.ContentScriptRequestCallback} contentScriptRequestCallback
             */
            function(contentScriptRequestCallback){
                self.handleResponse.call(self, contentScriptRequestCallback); // TODO: is .call() necessary?
            }); // setup the response handler for the port
        
		if (this.jQuery("#filmtipsetImdbLinks").length === 0)
			this.jQuery("body").append(
				FilmtipsetExtension.Links.progress_html
					.replace(
						"%remsaUrl%", 
						chrome.extension.getURL("images/progress.png")
						)
				);
				
		this.jQuery("#filmLinkCount").html(this.$links.length);
        
		this.jQuery("#filmtipsetImdbLinks")
            //.hide() // Hide the progress bar and...
            .delay(3000) // ...wait 3 seconds before...
            .slideDown(500, "linear", function(){}); // ...showing it (to avoid it showing it at all if possible)
        this.processOneLink(0);
        }
	else 
		this.running = false;
    };

/**
 @param {number} currentLinkNumber Link number to process
 */
FilmtipsetExtension.Links.prototype.processOneLink = function(currentLinkNumber){
    var self = this;
    var $a = this.jQuery(this.$links[currentLinkNumber]);
    var href = $a.attr('href') + '/';
    var common = new FilmtipsetExtension.Common();
    var imdbIdt = common.getImdbIdFromUrl(href);
    if (imdbIdt) {
        self.linkProcessingPort.postMessage(
            new FilmtipsetExtension.GradeForLinkRequest(
                imdbIdt,
                currentLinkNumber.toString()
                )
            );
        }
    else {
        self.linkProcessingPort.postMessage(
            new FilmtipsetExtension.GradeForSearchRequest(
                $a.text(),
                currentLinkNumber.toString()
                )
            );
        }
    };