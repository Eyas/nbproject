/*
 * buildEmbed.js: build embedded NB 
 *
 Author 
 cf AUTHORS.txt 

 License
 Copyright (c) 2010-2012 Massachusetts Institute of Technology.
 MIT License (cf. MIT-LICENSE.txt or http://www.opensource.org/licenses/mit-license.php)
*/
var NB$ = jQuery.noConflict();

(function () {
    var add_css = function (url) {
        var o = document.createElement("link");
        o.type = "text/css";
        o.href = url;
        o.rel = "stylesheet";
        document.getElementsByTagName("head")[0].appendChild(o);
    };

    NB$(function () {
        var scriptname = "_NB.js";
        var nb_script = jQuery("script[src$='" + scriptname + "']");
        if (nb_script.length === 0) {
            throw "cannot find server url";
        }

        var cur = nb_script[nb_script.length-1];
        var server_info = cur.src.match(/([^:]*):\/\/([^\/]*)/);
        var server_url = server_info[1] + "://" + server_info[2];

        add_css(server_url + "/content/compiled/embed_NB.css");

        if (window === window.top) {
            NB$("<div>").css({
                "position": "fixed",
                "top": "0",
                "right": "0",
                "font-weight": "bold",
                "font-size": "1.5em"
            }).
                html("<a href=\"" + server_url + "/url/" + encodeURI(window.location.href) + "\">View on NB</a>").
                appendTo("body");
        }
    });
})();
