/*
 * step19.js: Spreadsheet
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
    NB.pers._selectTimerID =  null;
    NB.pers.grade2litt = {4: "A", 3: "B", 2: "C", 1: "D", 0: "F"};
    NB.pers.call("getParams",{name: ["RESOLUTIONS", "RESOLUTION_COORDINATES"]},function(p){
	    $.concierge.addConstants(p.value);
	});
    $.mods.declare({
	    spreadsheetview: {
		js: ["/content/modules/dev/ui.spreadsheetView1.js"],
		    css: [ "/content/modules/dev/ui.spreadsheetView1.css" ]
		    }, 
		notepaneview: {js: ["/content/modules/dev/ui.notepaneView10.js"],css: [] }, 
		docview: {js: ["/content/modules/dev/ui.docView10.js", "/content/modules/dev/ui.drawable4.js"],
		    css: [ "/content/modules/dev/ui.docView5.css" , "/content/modules/dev/ui.drawable.css" ] },
		});
    
    //Factories: methods called if an event calls for a function that's not yet present
    $.concierge.addFactory("spreadsheet", "spreadsheet_viewer", function(id){
	    var pers_id		= "pers_"+id;
	    var $vp		= $("<div class='dummy-viewport'><div class='ui-widget-header' style='height:24px;' /></div>").prependTo("body");
	    var $pers		= $("<div id='"+pers_id+"'/>").appendTo($vp);
	    var spreadsheetview = {priority: 1, min_width: 600, desired_width: 60, 
				   content: function($div){
		    $.mods.ready("spreadsheetview", function(){
			    $div.spreadsheetview();
			    $div.spreadsheetview("set_model",NB.pers.store );
			});
		}
	    };
	    var notesview	=  {priority: 1, min_width: 500, desired_width:50 , min_height: 800, desired_height: 70, 
				    content: function($div){
		    $.mods.ready("notepaneview", function(){
			    $div.notepaneView();
			    $div.notepaneView("set_model",NB.pers.store );
			});
		}
	    }; 
	    var docview	= {priority: 1, min_width: 500, desired_width: 50,  min_height: 300, desired_height: 30, 
			   content: function($div){
		    $.mods.ready("docview", function(){
			    $div.docView({img_server: NB.conf.servers.img});
			    $div.docView("set_model",NB.pers.store );			    
			});
		}
	    };
	    var self = NB.pers;
	    $pers.perspective({
		    height: function(){return $vp.height() - $pers.offset().top;}, 
			listens: {
			selection: function(evt){
			    var v = evt.value;
			    var sel = v.sel;
			    var m = NB.pers.store;
			    var id_source = v.files[sel[1]-1].id ;
			    var id_author = v.users[sel[0]-1].id ;			   
			    var L =  m.meta.loadednotes;
			    var f_trigger;
			    var f_on_data = function(P, _id_author){
				m.add("seen", P["seen"]);
				m.add("comment", P["comments"]);
				m.add("location", P["locations"]);					
				//generate collection: 
				var ids_location = [];
				var ids_location_idx = {};
				var id_location;
				var items = P["locations"];
				
				var f_sort = function(o1, o2){
				    var loc1 = m.o.location[o1];
				    var loc2 = m.o.location[o2];
				    return (loc1.page != loc2.page) ? (loc1.page-loc2.page) : (loc1.top-loc2.top);
				}
				for (var i in items){		 
				    id_location = items[i].ID;
				    ids_location.push(id_location);
				    ids_location_idx[id_location]=ids_location.length-1;
				}
				ids_location.sort(f_sort);
				L[id_source][_id_author] = {items: ids_location, index: ids_location_idx};				
			    };
			    if (!(id_source in L)){
				L[id_source]={};
			    }
			    var id_next_author = self.find_next_author(v);
			    if (!(id_author +"_" +id_source in m.o.stat)){
				//no need to call server if there's no note. 
				return;
			    }
			    if (self._selectTimerID != null){
				window.clearTimeout(self._selectTimerID);
				self._selectTimerID =  null;
			    }
			    if (id_author in L[id_source]){//use cached values
				f_trigger = function(){
				    NB.pers.collection.items = L[id_source][id_author].items;
				    NB.pers.collection.index= L[id_source][id_author].index;
				    NB.pers.collection.meta = {id_user: id_author, id_source: id_source};
				    $.concierge.trigger({type:"collection", value: 1});	
				    if (id_next_author != null){
					NB.pers.call("getMyNotes", {query: "auth_admin", id_source:id_source , id_author:id_next_author}, function(P3){
						//load data silently
						f_on_data(P3, id_next_author);
					    });
				    }
				}
				self._selectTimerID =  window.setTimeout(f_trigger, 10);
			    }
			    else{
				f_trigger = function(){
				    var P2 =  {query: "auth_admin", id_source:id_source , id_author:id_author };
				    NB.pers.call("getMyNotes", P2, function(P){
					    //var m = NB.pers.store;
					    f_on_data(P, id_author);
					    NB.pers.collection.items = 	L[id_source][id_author].items;
					    NB.pers.collection.index= 	L[id_source][id_author].index;
					    NB.pers.collection.meta = {id_user: id_author, id_source: id_source};
					    $.concierge.trigger({type:"collection", value: 1});	
					    if (id_next_author != null){
						NB.pers.call("getMyNotes", {query: "auth_admin", id_source:id_source , id_author:id_next_author}, function(P3){
							//load data silently
							f_on_data(P3, id_next_author);
						    });
					    }
					});		
				};
				self._selectTimerID =  window.setTimeout(f_trigger, 500);
			    }
			}
		    },
			views: {
			v1:{ data: spreadsheetview }, 
			    v2:{children: {
				v1:{ data:notesview}, v2:{ data: docview}, orientation: "horizontal"}}, orientation: "vertical"}
		});
	});
    $.concierge.addComponents({	
	    get_collection:		function(P, cb){return NB.pers.collection;},
		set_grade_assignment: function(P,cb){
		NB.pers.call("set_grade_assignment", P, cb);
	    },
		grade2litt: function(P,cb){return NB.pers.grade2litt[P]}, 
		});
    
    //get data: 
    var P2 =  {};
    if ("id_ensemble" in NB.pers.params){
	P2["id_ensemble"] = NB.pers.params.id_ensemble;
    }
    NB.pers.call("get_stats_ensemble", P2,  NB.pers.createStore );
};


    
NB.pers.createStore = function(payload){
    var m = new NB.models.Store();
    m.meta = {loadednotes:{}};
    NB.pers.store = m;  
    $.concierge.addConstants({res: 288, scale: 25});
    m.create(payload, {
	    ensemble:	{pFieldName: "ensembles"}, 
		file:	{pFieldName: "files", references: {id_ensemble: "ensemble", id_folder: "folder"}}, 
		folder: {pFieldName: "folders", references: {id_ensemble: "ensemble", id_parent: "folder"}}, 
		user: {pFieldName: "users"}, 
		stat: {pFieldName: "stats"}, 
		grade: {pFieldName: "grades"}, 
		comment:{references: {id_location: "location"}},
		location:{references: {id_ensemble: "ensemble", id_source: "file"}}, 
		seen:{references: {id_location: "location"}}	    
	});
    //    NB.pers.sequence = payload.sequence;
    $.concierge.setHistoryHelper(function(payload, cb){NB.pers.call("log_history", payload, cb);}, 120000);
    $.concierge.trigger({type:"spreadsheet", value: 1});

    document.title = $.E(m.get("ensemble", {}).first().name + " spreadsheet");
    NB.pers.collection = {items: [], index: {}};
};

NB.pers.find_next_author = function(v){
    var self		= this;
    var sel		= v.sel;
    var m		= self.store;
    var L		= m.meta.loadednotes;
    var id_author	= null;
    var id_author_next  = null;
    var id_source = v.files[sel[1]-1].id ;
    //find next author, if any: 
    var nxt		= sel[0];
    while (nxt<v.users.length){
	id_author	= v.users[nxt].id;
	if (id_author+"_"+id_source in m.o.stat){
	    if (!(id_author in L[id_source])){
		id_author_next = id_author;
		break;
	    }
	}
	nxt++;
    }
    return id_author_next;
};