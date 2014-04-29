/*
 * buildEmbed.js: build embedded NB 
 *
 Author 
 cf AUTHORS.txt 

 License
 Copyright (c) 2010-2012 Massachusetts Institute of Technology.
 MIT License (cf. MIT-LICENSE.txt or http://www.opensource.org/licenses/mit-license.php)
*/

(function(GLOB){
    
    if ("NB$" in window){
        var $ = NB$;
    }
    var $str = "NB$" in window ? "NB$" : "jQuery";

    var id_ensemble = null;  
    GLOB.pers.iframe_id = "nb_iframe";

    GLOB.pers.init = function(){
        GLOB.pers.connection_id = 0;
        GLOB.pers.embedded = true;
        //add our CSS
        var cur =  GLOB.pers.currentScript;
        var server_info =  cur.src.match(/([^:]*):\/\/([^\/]*)/);    
        var server_url = server_info[1]+"://"+server_info[2];
        GLOB.pers.add_css(server_url + "/content/compiled/embed_NB.css");

        // Make sure concierge won't steal our keys!
        $.concierge.keydown_block = false;

        //tell who to make rpc requests to
        GLOB.conf.servers.rpc=GLOB.pers.server_url;        
    }; 
    
    jQuery(function () {
        GLOB.pers.params = GLOB.dom.getParams(); 
        GLOB.pers.preinit();
    });
})(NB);
