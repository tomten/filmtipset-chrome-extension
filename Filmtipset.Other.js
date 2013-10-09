"use strict";

// constructor
function Other(jQuery){
    this.maxFakeId = 0;
    this.jQuery = jQuery;
    }

Other.image_html_template = '<img style="position:absolute;" width="20" height="20" src="%grade%" />';    
Other.jquery_imdb_link_selector = 'a:regex(href,(www\\.)?imdb\\.(.+)\\/tt(\\d+))';    
Other.popover_html_template = '<a style="float:right;" href="%url%"><img style="padding-left:10px;" src="%imgUrl%" /></a>%title%<br/><br/>%description%<br style="clear:both;" clear="both" />';
Other.progress_html = 
    '<div id="filmtipsetImdbLinks" style="background-image: url(%§aUrl%);">'+
        'Processing '+
        '<span id="filmLinkCount">'+
            '%linkCount%'+
        '</span>'+
        'IMDB links...'+
    '</div>';
    
Other.prototype.processLinks = function(){
    var links = this.jQuery(Other.jquery_imdb_link_selector);
    if (links.length > 0) {
        this.jQuery("body").append(
            Other.progress_html
                .replace("%remsaUrl%", chrome.extension.getURL("images/progress.png"))
                .replace("%linkCount%", links.length)
            );
        this.jQuery("#filmtipsetImdbLinks").hide().delay(1000).fadeIn(1000);        
        var fakeId = 0;
        var jQuery = this.jQuery;
        var self = this;
        links.each(function(){
            var $a = jQuery(this);
            var href = $a.attr('href') + '/';
            fakeId++;
            self.maxFakeId = fakeId;
            $a.attr('fakeid', fakeId);
            var common = new Common();
            var imdbIdt = common.getImdbIdFromUrl(href);
            chrome.extension.sendRequest(
                { 
                    action: "gradeForLink", 
                    fakeId: fakeId, 
                    imdbId: imdbIdt 
                    }, 
                function(fakeIdAndGrade) {
                    var fakeId = fakeIdAndGrade.fakeId;
                    var grade = fakeIdAndGrade.grade;
                    var gradeUrl = chrome.extension.getURL(grade);
                    var $link = self.jQuery("a[fakeid='%fakeid%']:first".replace("%fakeid%", fakeId));
                    if (
                        fakeIdAndGrade.movieInfo &&
                        fakeIdAndGrade.movieInfo[0] &&
                        fakeIdAndGrade.movieInfo[0].data &&
                        fakeIdAndGrade.movieInfo[0].data[0] &&
                        fakeIdAndGrade.movieInfo[0].data[0].movie 
                        )
                        $link.tipTip({ 
                            delay: 1, 
                            maxWidth: "300px",
                            fadeIn: 100, 
                            fadeOut: 400, 
                            edgeOffset: 0,
                            keepAlive: true,
                            content: 
                                Other.popover_html_template
                                    .replace("%description%", fakeIdAndGrade.movieInfo[0].data[0].movie.description)
                                    .replace("%title%", fakeIdAndGrade.movieInfo[0].data[0].movie.name)
                                    .replace("%imgUrl%", fakeIdAndGrade.movieInfo[0].data[0].movie.image)
                                    .replace("%url%", fakeIdAndGrade.movieInfo[0].data[0].movie.url)
                            });
                    $link.append(Other.image_html_template.replace("%grade%", gradeUrl));
                    if (fakeId == self.maxFakeId) 
                        self.jQuery("#filmtipsetImdbLinks").stop().fadeOut(1000);
                    var $linkCount = self.jQuery("#filmLinkCount");
                    var linksLeft = parseInt($linkCount.html(), 10);
                    linksLeft--;
                    $linkCount.html(linksLeft);
                    }
                );
            });
        }
    };
    
$(function() {
    var other = new Other($);
    other.processLinks();
    });