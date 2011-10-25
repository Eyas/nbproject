/*
 * step7.js: 
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
    Module.require("NB.conf", 0.1);
    Module.require("NB.pers", 0.1);
}
catch (e){
    alert("[inbox] Init Error: "+e);
}

NB.pers.init = function(){
    $.mods.declare({
	    docview: {
		files: {
		    "../modules/dev/ui.docView4.js": "js17", 
		    "../modules/dev/ui.docView.css": "css",
		    "../modules/dev/ui.editor3.js": "js17", 
		    "../modules/dev/ui.editor3.css": "css", 
		}
	    }});
    $("#pers1").perspective();
    //put views update here, before updating perspective. 
    $("#view-1").sampleView();
    $("#view-2").treeView();
    $("#pers1").perspective("update");

    let getOrCreateViewport = function(){
	let $vp = $("div.viewport");
	// is a viewport already there ? 
	if ($vp.length==0){
	    //no, so we must have only one perspective: Embed it in a viewport now
	    $vp = $("div.perspective").wrap("<div class='viewport'/>").parent().viewport();
	}
	if ($vp.length != 1){
	    alert("Assertion failed: There should be 1 viewport but there are "+$vp.length);
	}
	return $vp;
    };
    
    
    //Factories: methods called if an event calls for a function that's not yet present
    $.concierge.addFactory("file", "doc_viewer", function(id){
	    $.mods.load("docview", function(){
		    let $vp		= getOrCreateViewport();
		    /*
		    $.createPerspective({ id: id, 
				       title: NB.pers.store.o.file[id].title, 
					      views: {
					      
		    */
		    let pers_id		= $vp.viewport("newView", "tab_"+id,NB.pers.store.o.file[id].title);
		    let clientWidth	= $vp.viewport("getClientSize").width; 
		    let $pers		= $("#"+pers_id);
		    let thumbnails	=  {priority: 2, min: 150, desired: 300};
		    let docview		=  {priority: 1, min: 700, desired: 800, 
					    content: function($div){
			    $div.docView({img_server: NB.conf.servers.img, invite_key: NB.conf.identity});
			    $div.docView("set_model",NB.pers.store );
			}};
		    let notesview	=  {priority: 1, min: 500, desired: 600}; 
		    $pers.perspective({
			    width: function(){return $vp.viewport("getClientSize").width;}, 
				views: {
				v1:{data:thumbnails},
				    v2:{children: {v1:{ data: docview }, v2:{ data: notesview}}, orientation: "vertical"}, 
				    orientation: "vertical"}
			});
		    
		    //.append("<div id='view1_"+id+"' style='min-width: "+clientWidth/2+"px;'/> <div class='separator' orientation='vertical'/><div id='view2_"+id+"'>garblu</div>");

		    //have to bring to front so we can size appropratelty: 
		    // the alternative would be to have a post-trigger mechanism
		    //SACHA: TODO: Do we really, since we use off-left technique instead of hiding it ? 
		    /*
		    $vp.viewport("select", $pers.parent()[0].id);
		    $pers.perspective();
		    let $v1 = $("#view1_"+id);
		    $v1.docView({img_server: NB.conf.servers.img, invite_key: NB.conf.identity});
		    $v1.docView("set_model",NB.pers.store );
		    $pers.perspective("update");
		    */
		});
	});
    
    //get data: 
    NB.pers.params = NB.dom.getParams();
    var identity = NB.auth.get_cookie("invite_key");
    if (identity != null){
	NB.conf.identity = identity;
    }
    let payload_objects = {types: ["ensembles", "folders", "files"]};
    if ("id_ensemble" in NB.pers.params){
	payload_objects["payload"]= {id_ensemble: NB.pers.params.id_ensemble};
    }
    NB.pers.call("getObjects",payload_objects, NB.pers.createStore);
    $.concierge.setConstants({res: 288, scale: 25});
    NB.pers.call("getParams",{name: ["RESOLUTIONS", "RESOLUTION_COORDINATES"]},function(p){$.concierge.addConstants(p.value)});
};


    
NB.pers.createStore = function(payload){
    NB.pers.store = new NB.models.Store();
    NB.pers.store.create(payload, {
	    ensemble:	{pFieldName: "ensembles"}, 
		file:	{pFieldName: "files", references: {id_ensemble: "ensemble", id_folder: "folder"}}, 
		folder: {pFieldName: "folders", references: {id_ensemble: "ensemble", id_parent: "folder"}}});
    $("#view-2").treeView('set_model', NB.pers.store);


};
