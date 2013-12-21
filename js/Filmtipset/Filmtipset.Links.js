"use strict";

/**
 * @constructor
 */
FilmtipsetExtension.Links = function (jQuery){
    this.jQuery = jQuery;
    this.$links = [];
    this.port = null;
    };

/** @const */
FilmtipsetExtension.Links.image_html_template = '<img style="position:absolute;" width="20" height="20" src="%grade%" />';    

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
    '<div id="filmtipsetImdbLinks" style="background-image: url(%remsaUrl%);">'+
        'Processing '+ // TODO: i18n
        '<span id="filmLinkCount">'+
            '%linkCount% '+
        '</span> '+
        'IMDB links...'+
    '</div>';

/** Filmtipsifies movie links on Google Movies */    
FilmtipsetExtension.Links.prototype.processLinksOnGoogleMovies = function(){
    this.processLinksInternal(FilmtipsetExtension.Links.jquery_imdb_link_selector_on_google_movies);
    };

/** Filmtipsifies internal IMDB links on IMDB */    
FilmtipsetExtension.Links.prototype.processLinksOnImdb = function(){
    this.processLinksInternal(FilmtipsetExtension.Links.jquery_imdb_link_selector_on_imdb);
    };

/** Filmtipsifies IMDB links on any normal site */    
FilmtipsetExtension.Links.prototype.processLinks = function(){
    this.processLinksInternal(FilmtipsetExtension.Links.jquery_imdb_link_selector);
    };

/** 
 Filmtipsifies links using the specified link selector
 @param {string} link_selector jQuery link selector
 @private 
 */
FilmtipsetExtension.Links.prototype.processLinksInternal = function(link_selector){
    var self = this;
    this.port = chrome.runtime.connect();
    this.port.onMessage.addListener(function(contentScriptRequestCallback) {
        console.log("got callback for #" + contentScriptRequestCallback.reference); // HACK
        var reference = contentScriptRequestCallback.reference;
        var gradeUrl = contentScriptRequestCallback.gradeIconUrl;
        var movieInfo = contentScriptRequestCallback.movieInfo;
        var $link = $(self.$links[reference]); 
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
        var $gradeImage = self.jQuery(FilmtipsetExtension.Links.image_html_template.replace("%grade%", gradeUrl));
        $gradeImage.hide();
        $link.append($gradeImage);
        $gradeImage.fadeIn(200); 
        if (reference >= self.$links.length - 1) { // HACK: Should be == something
            self.jQuery("#filmtipsetImdbLinks").stop().slideUp(500, "linear", function(){});
            self.port.disconnect();
            }
        else {
            var $linkCount = self.jQuery("#filmLinkCount");
            var linksLeft = parseInt($linkCount.html(), 10);
            linksLeft--;
            $linkCount.html(linksLeft);
            window.setTimeout( 
                function(){
                    self.processOneLink(parseInt(reference) + 1);
                    }, 
                1
                );
            }
        });
    this.$links = this.jQuery(link_selector);
    if (this.$links.length > 0) {
        this.jQuery("body").append(
            FilmtipsetExtension.Links.progress_html
                .replace("%remsaUrl%", chrome.extension.getURL("images/progress.png"))
                .replace("%linkCount%", this.$links.length)
            );
        this.jQuery("#filmtipsetImdbLinks")
            .hide() // Hide the progress bar and...
            .delay(3000) // ...wait 3 seconds before...
            .slideDown(500, "linear", function(){}); // ...showing it (to avoid it showing it at all if possible)
        this.processOneLink(0);
        }
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
    /**
    @param {FilmtipsetExtension.ContentScriptRequestCallback} contentScriptRequestCallback
    */
    //var callback = function(contentScriptRequestCallback) {
    //    };
    if (imdbIdt) {
        console.log("posting gradeForLinkRequest message for link #" + currentLinkNumber); // HACK
        self.port.postMessage(
            new FilmtipsetExtension.GradeForLinkRequest(
                imdbIdt,
                currentLinkNumber
                )
            );
        }
    else {
        chrome.runtime.sendMessage(
            new FilmtipsetExtension.GradeForSearchRequest(
                $a.text(),
                currentLinkNumber
                ),
            callback
            );
        }
    };