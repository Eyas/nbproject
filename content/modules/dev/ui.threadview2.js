/* threadview Plugin
 * Depends:
 *	ui.core.js
 * 	ui.view.js
 *

 Author 
 Sacha Zyto (sacha@csail.mit.edu) 

 License
 Copyright (c) 2010 Massachusetts Institute of Technology.
 MIT License (cf. MIT-LICENSE.txt or http://www.opensource.org/licenses/mit-license.php)
*/

(function($) {
    var V_OBJ = $.extend({},$.ui.view.prototype,{
	    _create: function() {
		$.ui.view.prototype._create.call(this);
		var self = this;
		self._location =  null; 
		//SACHA: FIXME (HACK) the 2 vars below are needed in order to defer rendering if code hasn't been loaded yet. For instance, when we have ?c=id_comment in the URL
		self._ready = false;
		self._doDelayedRender = false;

		/*
		  self.element.addClass("threadview").append("<div class='threadview-header'><button action='prev'>Prev</button> <button action='next'>Next</button> </div><div class='threadview-pane'/>");
		  
		  $("button[action=prev]", self.element).click(function(){
		  alert("todo");
		  });
		  $("button[action=next]", self.element).click(function(){
		  alert("todo");
		  });
		*/
		self.element.addClass("threadview").append("<div class='threadview-header'></div><div class='threadview-pane'/>");
		
		//splash screen: 
		$("div.threadview-pane", self.element).append($.concierge.get_component("mini_splashscreen")());		
		$.mods.declare({
			threadview1: {js: [], css: ["/content/modules/dev/ui.threadview1.css"]}, 
			    contextmenu: {js:["/content/modules/contextmenu/jquery.contextMenu.js"] , css: ["/content/modules/contextmenu/jquery.contextMenu.css"]}});
		$.mods.ready("threadview1", function(){});
		$.mods.ready("contextmenu", function(){self._ready = true;if (self._doDelayedRender){self._render();}});
		$("body").append("<ul id='contextmenu_threadview' class='contextMenu'> <li class='context-edit'><a href='#edit'>Edit...</a></li> <li class='context-reply'><a href='#reply'>Reply</a></li>  <li class='context-delete separator'><a href='#delete'>Delete...</a></li></ul>");	       	    
	    },
	    _defaultHandler: function(evt){
		if (this._file ==  $.concierge.get_state("file")){
		    switch (evt.type){
		    case "select_thread":
		    this._location =  evt.value;
		    this._render();
		    break;
		    }	
		}	
	    },
	    _lens: function(o){
		var bold_cl = this._model.get("seen", {id: o.ID}).is_empty() ? "" : "note-bold";
		var admin_info = o.admin ? " <div class='nbicon adminicon'  title='This user is an instructor/admin for this class' /> ": " ";
		var me_info = (o.id_author == this._me.id) ? " <div class='nbicon meicon' title='I am the author of this comment'/> ":" ";
		var type_info = "";
		if (o.type == 1) {
		    type_info =  " <div class='nbicon privateicon' title='[me] This comment is private'/> ";
		}
		else if (o.type ==2){
		    type_info = " <div class='nbicon stafficon' title='[staff] This comment is for Instructors and TAs'/> ";
		}			
		//var author_info = o.signed ? " <span class='author'>"+o.fullname+"</span> ":" ";
		var author_info =  " <span class='author'>"+o.fullname+"</span> ";

		var creation_info = " <span class='created'> - "+o.created+"</span> ";
		var replymenu = " <a class = 'replymenu' href='javascript:void(0)'>Reply</a> ";
		var optionmenu = " <a class='optionmenu' href='javascript:void(0)'>Actions</a> ";
		//return ["<div class='note-lens' id_item='",o.ID,"'><span class='note-body ",bold_cl,"'>",$.E(o.body).replace(/\n/g, "<br/>"),"</span>", author_info,admin_info,creation_info,replymenu, optionmenu,"</div>"].join("");
		var body = o.body.replace(/\s/g, "")=="" ? "<span class='empty_comment'>Empty Comment</span>" : $.E(o.body).replace(/\n/g, "<br/>");
		return ["<div class='note-lens' id_item='",o.ID,"'><div class='lensmenu'>", replymenu, optionmenu,"</div><span class='note-body ",bold_cl,"'>",body,"</span>", author_info,admin_info,me_info, type_info, creation_info,"</div>"].join("");

	    },
	    _comment_sort_fct: function(o1, o2){return o1.ID-o2.ID;},
	    _fill_tree: function(m, c){
		var $div = $("<div class='threadview-branch'>"+this._lens(c)+"</div>");
		var children = m.get("comment", {ID_location: c.ID_location, id_parent: c.ID}).sort(this._comment_sort_fct);		
		for (var i = 0; i<children.length;i++){
		    $div.append(this._fill_tree(m,children[i]));
		}
		return $div;
	    },
	    _render: function(){	
		var self	= this;
		if (self._ready == false){
		    self._doDelayedRender = true;
		    return;
		}
		var model	= self._model; 			      
		var $pane	= $("div.threadview-pane", self.element).empty();
		var root	= model.get("comment", {ID_location: self._location, id_parent: null}).sort(this._comment_sort_fct)[0];
		if (root == undefined){ //happens after deleting a thread that only contains 1 annotation
		    return;
		}
		self._me =  $.concierge.get_component("get_userinfo")();
		var guest_msg	= "<span>You need to <a href='javascript:$.concierge.get_component(\"register_user_menu\")()'>register</a>  or  <a href='javascript:$.concierge.get_component(\"login_user_menu\")()'>login</a> in order to post a reply...</span>";
		$pane.append(this._fill_tree(model, root));
		var f_on_delete = function(p){
		    $.I("Note #"+p.id_comment+" has been deleted");
		    var c = model.o.comment[p.id_comment];
		    model.remove("comment", p.id_comment);
		    if (c.id_parent == null){
			model.remove("location", c.ID_location);
		    }
		    else{
			//we force an update of locations in case some styling needs to be changed. 
			var locs = {};
			locs[c.ID_location] = model.o.location[c.ID_location];
			model.add("location", locs);
		    }
		};
		var f_context = function(action, el, pos){
		    var $el	= $(el);
		    var $note	=  $el.closest("div.note-lens");
		    var id_item =  $note.attr("id_item");
		    switch (action){
		    case "reply": 			
			if (self._me.guest == 1){
			    $.I(guest_msg, true, 10000);
			}
			else{
			    $.concierge.trigger({type: "reply_thread", value: id_item});
			}
			break;
		    case "edit": 
			$.concierge.trigger({type: "edit_thread", value: id_item});
			break;
		    case "delete":
			if (confirm("Are you sure you want to delete this note ?")){
			    $.concierge.get_component("note_deleter")({id_comment: id_item}, f_on_delete);
			}
			break;
		    }
		};
		var f_reply = function(event){
		    var id_item = $(event.target).closest("div.note-lens").attr("id_item");
		    if (self._me.guest == 1){
			$.I(guest_msg, true, 10000);
		    }
		    else{
			$.concierge.trigger({type: "reply_thread", value: id_item});
			}
		};
		$("div.note-lens", $pane).contextMenu({menu: "contextmenu_threadview"}, f_context);
		$("a.replymenu", $pane).click(f_reply);
		$("a.optionmenu", $pane).contextMenu({menu: "contextmenu_threadview", leftButton: true}, f_context);
		$("#contextmenu_threadview").bind("beforeShow", function(event, el){
			var elts_disabled = $("li.context-edit, li.context-delete", this).addClass("disabled");
			var id_item = el.closest("div.note-lens").attr("id_item");
			var model	= self._model; 			      
			var note = model.o.comment[id_item];
			if (note.id_author == self._me.id && model.get("comment", {id_parent: id_item}).is_empty()){
			    elts_disabled.removeClass("disabled");
			}		
		    });
	    }, 
	    set_model: function(model){
		var self=this;
		self._model =  model;
		self._me = null;
		var id_source = $.concierge.get_state("file");
		self._file =  id_source ; 
		model.register($.ui.view.prototype.get_adapter.call(this),  {comment: null});
	    },
	    _keydown: function(event){ // same as ui.noteview8.js
		//just proxy to other view if any interested. 
		$.concierge.trigger({type: "keydown", value: event});
		return true;
	    }, 
	    update: function(action, payload, items_fieldname){
		if ((action == "add"|| action == "remove") && items_fieldname=="comment" && this._location){
		    this._render();
		}
	    }
	});
			 
    $.widget("ui.threadview",V_OBJ );
    $.ui.threadview.prototype.options = {
	loc_sort_fct: function(o1, o2){return o1.top-o2.top;},
	listens: {
	    select_thread: null, 
	}
    };
})(jQuery);
