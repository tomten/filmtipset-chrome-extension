﻿"use strict";

/**
 * @constructor
 */
FilmtipsetExtension.Personal = function (jQuery){
    this.dirty = false;
    this.jQuery = jQuery;
    };

FilmtipsetExtension.Personal.prototype.init = function() {
    this.loadOptions();
    var self = this;
    this.jQuery(".saveoptions").click(function(){ 
        self.saveOptions(); 
        });
    this.jQuery(".localStorage")
        .change(function(){ self.setDirty(); })
        .bind("paste", function(){ self.setDirty(); })
        .keyup(function(){ self.setDirty(); })
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

FilmtipsetExtension.Personal.prototype.setDirty = function() {
    if (!this.dirty) {
        this.dirty = true;
        this.jQuery("#save").fadeIn("fast");
        }
    };

FilmtipsetExtension.Personal.prototype.loadOptions = function(){
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

FilmtipsetExtension.Personal.prototype.saveOptions = function() {
    var jQuery = this.jQuery;
    var $userKey = this.jQuery("input[name='userKey']");
    var userKeyToValidate = $userKey.val();
    var film = new FilmtipsetExtension.FilmtipsetApi(
        localStorage.accessKey, // HACK
        userKeyToValidate,
        null, // No need for cache here
        null // No nee for logger here
        );
    var self = this;
    film.validateUserKey(
        userKeyToValidate,
        function(userKeyWasValid){
            if (!userKeyWasValid) {
                alert(chrome.i18n.getMessage("invalidApiKey")); 
                return;
                }
            self.jQuery(".localStorage").each(
                function() {
                    var $localStorageElement = jQuery(this);
                    var name = $localStorageElement.attr("name");
                    var val = $localStorageElement.val();
                    localStorage[name] = val;
                    }
                );
            self.dirty = false;
            self.loadOptions();
            }
        );
    };