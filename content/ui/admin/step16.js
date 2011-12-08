/*
 * step16.js: 
 * Requires the following modules:
 *		Module
 *		NB
 *		NB.auth
 *		jquery
 *
 *
 Author 
 Sacha Zyto (sacha@csail.mit.edu) 

 License
 Copyright (c) 2010 Massachusetts Institute of Technology.
 MIT License (cf. MIT-LICENSE.txt or http://www.opensource.org/licenses/mit-license.php)
*/

try{    
    Module.require("NB", 0.1);
    Module.require("NB.auth", 0.1);
    Module.require("NB.pers", 0.1);
}
catch (e){
    alert("[inbox] Init Error: "+e);
}

NB.pers.init = function(){
    var matches = document.location.pathname.match(/\/(\d*)$/);
    if (matches==null || matches.length != 2){
	alert("Can't open file b/c URL pathname doesn't have an integer: "+document.location.pathname);
    }
    NB.pers.id_source =  matches[1];
    NB.pers.call("getParams",{name: ["RESOLUTIONS", "RESOLUTION_COORDINATES"]},function(p){
	    $.concierge.addConstants(p.value);
	});
    $.mods.declare({
	    docview: {
		js: ["/content/modules/dev/ui.docView8.js",  "/content/modules/dev/ui.drawable4.js"],
		    css: [ "/content/modules/dev/ui.docView5.css" , "/content/modules/dev/ui.drawable.css" ]
		    }, 
		notepaneview: {js: ["/content/modules/dev/ui.notepaneView8.js"],css: ["/content/modules/dev/ui.notepaneView6.css"] }, 
		threadview: {js: ["/content/modules/dev/ui.threadview2.js"],css: [] },
		editorview: {js: ["/content/modules/dev/ui.editorview2.js"],css: [] },

	});
    
    //Factories: methods called if an event calls for a function that's not yet present
    $.concierge.addFactory("file", "doc_viewer", function(id){
		    var pers_id		= "pers_"+id;
		    var $vp		= $("<div class='dummy-viewport'><div class='ui-widget-header' style='height:24px;' /></div>").prependTo("body");
		    var $pers		= $("<div id='"+pers_id+"'/>").appendTo($vp);
		    var docview		=  {priority: 1, min_width: 950, desired_width: 50, 
					    content: function($div){
			    $.mods.ready("docview", function(){
				    $div.docView({img_server: NB.conf.servers.img});
				    $div.docView("set_model",NB.pers.store );
				});
			}
		    };
		    var notesview	=  {priority: 1, min_width: 650, desired_width: 35, min_height: 1000, desired_height: 50, 
					    content: function($div){
			    $.mods.ready("notepaneview", function(){
				    $div.notepaneView();
				    $div.notepaneView("set_model",NB.pers.store );
				});
			}
		    }; 
		    var threadview	= {priority: 1, min_width: 650, desired_width: 35,  min_height: 1000, desired_height: 50, 
					   content: function($div){
			    $.mods.ready("threadview", function(){
				    $div.threadview();
				    $div.threadview("set_model",NB.pers.store );			    
				});
			}
		    };
		    var editorview	=  {priority: 1, min_width: 650, desired_width: 35,  min_height: 1000, desired_height: 50, transcient: true,  
					   content: function($div){
			    $.mods.ready("editorview", function(){
				    var m = NB.pers.store;
				    var ensemble = m.o.ensemble[m.o.file[id].id_ensemble];				    
				    $div.editorview({allowStaffOnly: ensemble.allow_staffonly, allowAnonymous: ensemble.allow_anonymous});
				    $div.editorview("set_model",NB.pers.store );			    
				});
			}
		    };
		    $pers.perspective({
			    height: function(){return $vp.height() - $pers.offset().top;}, 
				listens: {
				page_peek: function(evt){
				    //need to add 1 value for uniqueness
				    $.concierge.logHistory("page", evt.value+"|"+id+"|"+(new Date()).getTime());
				}, 
				close_view: function(evt){
				    if (evt.value == this.l.element[0].id){
					delete($.concierge.features.doc_viewer[id]);
				    }
				    $.D("closeview: ", evt, this.l.element[0].id);
				} 	
			    }, 
				views: {
					v1:{ data: docview }, 
					v2:{children: {
						v1:{ data: notesview}, 
						    v2:{children: {v1: { data: threadview}, v2: {data: editorview}, orientation: "horizontal"}},  orientation: "horizontal"
					    }
				}, orientation: "vertical"}
			});
	});
    
    //get data: 
    var payload_objects = {types: ["ensembles", "folders", "files"]};
    if ("id_ensemble" in NB.pers.params){
	payload_objects["payload"]= {id_ensemble: NB.pers.params.id_ensemble};
    }
    NB.pers.call("getGuestFileInfo", {id_source: NB.pers.id_source}, NB.pers.createStore, NB.pers.on_fileinfo_error );
    $.concierge.addConstants({res: 288, scale: 25});
    $.concierge.addComponents({
	    notes_loader:	function(P, cb){NB.pers.call("getNotes", P, cb);}, 
		note_creator:	function(P, cb){NB.pers.call("saveNote", P, cb);},
		note_editor:	function(P, cb){NB.pers.call("editNote", P, cb);},
		});   
};
    
NB.pers.createStore = function(payload){
    NB.pers.store = new NB.models.Store();
    NB.pers.store.create(payload, {
	    ensemble:	{pFieldName: "ensembles"}, 
		file:	{pFieldName: "files", references: {id_ensemble: "ensemble", id_folder: "folder"}}, 
		folder: {pFieldName: "folders", references: {id_ensemble: "ensemble", id_parent: "folder"}}, 
		comment:{references: {id_location: "location"}},
		location:{references: {id_ensemble: "ensemble", id_source: "file"}}, 
		link: {pFieldName: "links"}, 
		mark: {}, 
		draft: {},
	    seen:{references: {id_location: "location"}}
	});
    //here we override the callback so that we can get new notes.
    var cb2 = function(P2){	
	var m = NB.pers.store;
	m.add("comment", P2["comments"]);
	m.add("location", P2["locations"]);
	var msg="";
	var l,c;
	for (var i in P2["comments"]){
	    c = m.o.comment[i];
	    l = m.o.location[c.ID_location];
	    if (c.id_author !=  $.concierge.get_component("get_userinfo")().id){    //do nothing if I'm the author: 		
		msg+="<a href='javascript:$.concierge.trigger({type: \"select_thread\", value:\""+l.ID+"\"})'>New comment on page "+l.page+"</a><br/>";
	    }
	}
	if (msg != ""){
	    $.I(msg, true);
	}
    };
    $.concierge.setHistoryHelper(function(_payload, cb){
	    _payload["__return"] = {type:"newNotesOnFile", a:{id_source: NB.pers.id_source}};
	    NB.pers.call("log_history", _payload, cb);
	}, 120000, cb2);    
    var matches = document.location.pathname.match(/\/(\d*)$/);
    if (matches==null || matches.length != 2){
	alert("Can't open file b/c URL pathname doesn't with an integer: "+document.location.pathname);
    }
    var id_source =  NB.pers.id_source;
    $.concierge.trigger({type:"file", value: id_source});
    var f = NB.pers.store.o.file[id_source];
    document.title = $.E(f.title + " ("+f.numpages +" pages)");
    $.concierge.get_component("notes_loader")( {file:id_source }, function(P){
	    var m = NB.pers.store;
	    m.add("seen", P["seen"]);
	    m.add("comment", P["comments"]);
	    m.add("location", P["locations"]);
	    m.add("link", P["links"]);
	    //now check if need to move to a given annotation: 
	    if ("c" in NB.pers.params){
		window.setTimeout(function(){
			var id =  NB.pers.params.c;
			var c = m.get("comment", {ID: NB.pers.params.c})[id];
			$.concierge.trigger({type: "select_thread", value: c.ID_location});
		    }, 100);
	    }
	    else if ("p" in NB.pers.params){
		window.setTimeout(function(){
			var page = NB.pers.params.p;
			$.concierge.trigger({type: "page", value: page});
		    }, 100);
	    }
	    else{
		window.setTimeout(function(){
			$.concierge.trigger({type: "page", value: 1});
		    }, 500);
	    }
	});
};

NB.pers.on_fileinfo_error = function(P){
    //    console.debug("fileinfo error", P);
    $("#login-window").hide();
    var me = $.concierge.get_component("get_userinfo")();
    var name = "a guest";
    var loginmenu = "";
    if (!(me.guest)){
	name = (me.firstname != null && me.lastname != null) ?  me.firstname + " " + me.lastname + " (" +me.email + ") ": me.email;
    }
    else{
	loginmenu = "Would you like to  <a href='javascript:$.concierge.get_component(\"login_user_menu\")()'>login as another NB User</a>, maybe ?";
    }
    $("<div><div id=\"splash-welcome\">Welcome to NB !</div> <br/>You're currently logged in as <b>"+$.E(name)+"</b>, which doesn't grant you sufficient privileges to see this page. <br/><br/>"+loginmenu+"</div>").dialog({title: "Access Restricted...", closeOnEscape: false,   open: function(event, ui) { $(".ui-dialog-titlebar-close").hide(); }, width: 600, buttons: {"Take me back to NB's home page": function(){
		    NB.auth.delete_cookie("userinfo");
		    NB.auth.delete_cookie("ckey");
		    document.location.pathname = "/logout?next=/"} 
	    }}); 
}
