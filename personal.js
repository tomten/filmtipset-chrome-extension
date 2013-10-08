"use strict";

// constructor
function Personal(jQuery){
    this.dirty = false;
    this.jQuery = jQuery;
    }

Personal.prototype.init = function() {
    this.loadOptions();
    var p = this;
    this.jQuery(".saveoptions").click(function(){ 
        p.saveOptions(); 
        });
    this.jQuery(".localStorage")
        .change(function(){ p.setDirty(); })
        .bind("paste", function(){ p.setDirty(); })
        .keyup(function(){ p.setDirty(); })
        ;
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

Personal.prototype.setDirty = function() {
    console.log("setDirty; this=" + this);
    if (!this.dirty) {
        this.dirty = true;
        this.jQuery("#save").fadeIn("fast");
        }
    };

Personal.prototype.loadOptions = function(){
    this.jQuery("#save").fadeOut("fast");
    var jQuery = this.jQuery;
    this.jQuery(".localStorage").each(
        function() {
            var ls = jQuery(this);
            var name = ls.attr("name");
            ls.val(localStorage[name]);            
            }
        );
        this.dirty = false;
    };

Personal.prototype.saveOptions = function() {
    var jQuery = this.jQuery;
    this.jQuery(".localStorage").each(
        function() {
            var ls = jQuery(this);
            var name = ls.attr("name");
            var val = ls.val();
            localStorage[name] = val;
            }
        );
        this.dirty = false;
        this.loadOptions();
    };

var personal = new Personal($);
personal.init();