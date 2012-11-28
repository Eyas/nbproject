/* Notepanes plugin
 * Depends:
 *	ui.core.js
 * 	ui.view.js
 *
 *
 * FEATURES PROVIDED: 
 *  - ensembleList
 *  - fileList
 *
 *

Author 
    Sacha Zyto (sacha@csail.mit.edu) 

License
    Copyright (c) 2010 Massachusetts Institute of Technology.
    MIT License (cf. MIT-LICENSE.txt or http://www.opensource.org/licenses/mit-license.php)
*/
(function($) {
    var __VISIBILITY={1:"Myself", 2:"Staff", 3:"Class"};
    var V_OBJ = $.extend({},$.ui.view.prototype,{
	    _init: function() {
		$.ui.view.prototype._init.call(this);
		var self = this;
		self.repaint();
		self.element.addClass("notepaneView");
		self.files_loaded = {}; 
		self.notecontrols = $("#notecontrols-template").clone().removeAttr("id");
		//for dummy: 
		//elf.element.html("<img src='/content/data/icons/png/proto/notepane.png'/>");
	    },
	    _defaultHandler: function(evt){
		let self = this;
		let id_menu  = "contextmenu_notepane";
		let f = self._getData('model').o.file[ $.concierge.get_state("file")];
		let locations = self._getData('model').o.location;
		let comments = self._getData('model').o.comment;
		let gradees = self._getData('model').o.gradee;
		let seen = self._getData('model').o.seen;
		let marks = self._getData('model').o.mark;
		let f_click = function(event){
		    let t = event.currentTarget;
		    let id_item = t.getAttribute("id_item");
		    $.concierge.trigger({type:"note_click", value: id_item});		   
		};
		let f_click_header = function(event){
		    let t = event.currentTarget
		    let p = t.parentNode;
		    let $t = $(t);
		    let $p = $(p);
		    let id_item = p.getAttribute("id_item");
		    let l = locations[id_item];
		    if (("expanded" in l) && (l.expanded)){
			l.expanded = false;
			$t.children("div.ui-icon").removeClass("ui-icon-triangle-1-s").addClass("ui-icon-triangle-1-e");
			$p.children("span.shortbody").show();
			$p.children("div.notes-container").hide();
		    }
		    else{
			l.expanded = true;
			$t.children("div.ui-icon").removeClass("ui-icon-triangle-1-e").addClass("ui-icon-triangle-1-s");
			$p.children("span.shortbody").hide();
			$("div.note-lens", p).each(function(){
				let id = this.getAttribute("id_item");
				let c  = comments[id];
				let section_msg = (("id_author" in c) && (c.id_author in gradees)) ? "<span class='my-student' title='This student is in my section'>in my section</span> ":" ";
				let answerplease_msg = (c.n_answerplease>0) ? "<span class='note-indicator "+(((id in marks) && (marks[id].answerplease==1))? "marked1":"")+"'><span>"+c.n_answerplease+"</span><img src='/content/data/icons/png/question_16.png'/></span>" : "";
				let approve_msg = (c.n_approve>0) ? "<span class='note-indicator "+(((id in marks) && (marks[id].approve==1))? "marked1":"")+"'><span>"+c.n_approve+"</span><img src='/content/data/icons/png/approve_16.png'/></span>" : "";
				let staff_ok = (c.p == 1) ? " <img src='/content/data/icons/png/approved.png' title='This has been approved by the staff as an authoritative answer'/> ":" ";
				//				let reject_msg = (c.n_reject>0) ? "<span class='note-indicator "+(((id in marks) && (marks[id].reject==1))? "marked1":"")+"'><span>"+c.n_reject+"</span><img src='/content/data/icons/png/reject_16.png'/></span>" : "";

				let favorite_msg = (c.n_favorite>0) ? "<span class='note-indicator "+(((id in marks) && (marks[id].favorite==1))? "marked1":"")+"'><span>"+c.n_favorite+"</span><img src='/content/data/icons/png/favorite_16.png'/></span>" : "";
				//				let hide_msg = (c.n_hide>0) ? "<span class='note-indicator "+(((id in marks) && (marks[id].hide==1))? "marked1":"")+"'><span>"+c.n_hide+"</span><img src='/content/data/icons/png/remove_16.png'/></span>" : "";
				this.innerHTML = "<span class='created'>"+c.created+"</span><span ID='author_email' class='email"+c.signed+" admin"+c.admin+"'>"+c.email+"</span> "+"<br/><a class='optionmenu floatright' href='javascript:void(0)'>options...</a><img src='/content/data/icons/png/type"+c.id_type+"_16.png'/>"+c.vis+section_msg+answerplease_msg+  approve_msg +   favorite_msg +    staff_ok+ "<br/><span class='body'>"+c.body.replace(/\n/g, "<br/>")+"</span><br/>";
				$("a.optionmenu", this).contextMenu({menu:id_menu, leftButton:true }, f_context) ;

			    });
			$p.children("div.notes-container").show();

		    }
		};
		let f_hover = function(event){
		    let id_item = event.currentTarget.getAttribute("id_item");
		    $.concierge.trigger({type:"note_hover", value: id_item});
		};
		let f_out = function(event){
		    let id_item = event.currentTarget.getAttribute("id_item");
		    $.concierge.trigger({type:"note_out", value: id_item});
		};
		let f_add_controls = function(event){
		    let id_item = event.currentTarget.getAttribute("id_item");
		    let $elt = $(this);
		    $elt.append(self.notecontrols);
		    /*
		    self.notecontrols.hide("fast", function(){
			    $elt.append(self.notecontrols);
			    self.notecontrols.show("fast");
			});
		    */
		};
		let f_remove_controls = function(event){
		    $("#notecontrols_-template")
		    //		    $.L("out");
		}
		let f_after_update = function(){
		    //$("div.notes-container", self.element).hide();
		    //		    $("div.location-lens", self.element).click(f_click).mouseover(f_hover).mouseout(f_out).each(function(i){
		    $("div.location-lens").unbind().click(f_click).mouseover(f_hover).mouseout(f_out).each(function(i){

			    let l = $("div.note-lens", this);
			    /*
			    let l = $("div.note-lens", this).each(function(j){
				    let c = comments[this.getAttribute("id_item")];
				    this.innerHTML=c.body.substring(0,100);
				});
			    */
			    let p = l.parent();
			    l.remove().sort(sort1).appendTo(p).mouseover(f_overlens).contextMenu({"menu":id_menu }, f_context);
			    /*.hoverIntent({sensitivity: 3,
				interval: 200, over: f_add_controls, timeout: 500, out: f_remove_controls} ) ;
			    */


			}).children("div.location-header").unbind().click(f_click_header);
		    /*
		    $("div.note-lens", self.element).mouseover(f_overlens).contextMenu({"menu":id_menu }, f_context).hoverIntent({sensitivity: 3,
				interval: 200, over: f_add_controls, timeout: 500, out: f_remove_controls} ) ;
		    */
		    //		    $("div.note-lens", self.element).mouseover(f_overlens).contextMenu({"menu":id_menu }, f_context)
		    $("span.global_comments_cnt").text(exhibit._collectionMap.collection_notepane_loc0.countRestrictedItems());


		};
		let f_on_option = function(p){
		    
		    let m = self._getData('model')
		    m.add("mark", p.marks);
		    m.add("comment", p.comments);
		    f_after_update();
		    
		    $.I("This note has been marked...");
		};
		let f_on_delete = function(p){
		    $.I("Note "+p.id_comment+" has been deleted");
		    self._getData('model').remove("comment", p.id_comment);
		};
		let f_context =  function(action, el, pos){
		    switch (action){
		    case "reply": 
		    self.editorFactory(el);
		    break;
		    case "edit":
		    self.editorFactory(el,true);
		    break;
		    case "delete": 
		    $.concierge.get_component("note_deleter")({id_comment: $(el).closest("div.note-lens").attr("id_item")}, f_on_delete);
		    break;
		    default: 
		    $.concierge.get_component("note_marker")({id_comment: $(el).closest("div.note-lens").attr("id_item"), action: action}, f_on_option);
		    }
		};
		let sort1=function(a,b){
		    return parseInt(a.getAttribute("id_item")) > parseInt(b.getAttribute("id_item")) ? 1 : -1 
		};
		let f_overlens=function(event){
		    let t = event.currentTarget;
		    let id_item = t.getAttribute("id_item");
		    let cm =  $("#"+id_menu);
		    if (cm.is(":visible")){ //don't update menu if already visible
			return;
		    }
		    $("li.edit, li.delete", cm).addClass("disabled");
		    let menus = [];
		    if (comments[id_item].email=="Me" && t.nextSibling==null){
			menus.push("li.edit");
			if ( t.nextSibling==null){
			    menus.push("li.delete");
			}
		    }
		    if (!(id_item in seen)){
			seen[id_item] = true;
			$.concierge.logRemote("seen", id_item); //regular update would be too slow
		    }
		    $(menus.join(","), cm).removeClass("disabled");
		    //now checkboxes:
		    $("input", cm).removeAttr("checked");
		    let actions = ["answerplease", "approve", "reject", "favorite", "hide"];		    
		    for (let i in actions){
			let action = actions[i];
			if ((id_item in marks) && (marks[id_item][action]==1)){
			    $("li."+action+ " input", cm)[0].setAttribute("checked", "checked");
			}
		    }
		     if (!(id_item in seen)){
			seen[id_item] = true;
			$.concierge.logRemote("seen", id_item); //regular update would be too slow
		    }
		};
	
		switch (evt.type){
		case "page":
		let facet = window.exhibit._collectionMap["collection_notepane_loc"]._facets[1];
		facet._filter(evt.value, "", true);
		//		facet._filter(0, "", false); //include global comments
		f_after_update();
		break;
		case "new_notes":
		f_after_update();
		break;
		case "file": 
		    self.element.parent().parent().viewport("smoothSelect", self.element.attr("id")+"-outer");
		    let cmaps = window.exhibit._collectionMap;
		    //		    cmaps.collection_notepane_loc._facets[1]._filter("-1", "", true); //avoid redrawing elements
		    cmaps.collection_notepane_loc._facets[0]._filter(evt.value, "", true);
		    cmaps.collection_notepane_loc0._facets[0]._filter(evt.value, "", true);
		    $("span.global_comments_cnt").text(cmaps.collection_notepane_loc0.countRestrictedItems());
		break;
		case "note_hover":
		    $("div.location-lens[id_item="+evt.value+"]", self.element).addClass("selected");
		    break;
		case "note_out": 
		    $("div.location-lens[id_item="+evt.value+"]", self.element).removeClass("selected");		
		    break;
		case "notes_loaded_for_file": 
		// this fixes a race condition between the "page" event the 1st time a file is loaded and when the notes are in the exbihit db
		
		    f_after_update();
		break;
		case "sel_click": 
		    let e = $("div.location-lens[id_item="+evt.value+"]",self.element);
		    if (e.length>0){
			e[0].scrollIntoView();
		    }
		    break;
		    }
	    }, 
	    editorFactory: function(el, doEdit){
		//open editor
		let self=this;
		let body  = $("span.body",el);
		let contents = doEdit ? body.text():"";
		let $el = $(el);
		let $note =  $el.closest("div.note-lens");
		let id_comment = $note.attr("id_item");
		let id_item =  (new Date()).getTime();
		let id_source =  $.concierge.get_state("file");
		let $editor = $("<div/>");
		$el.append($editor);
		let ed_args = {note:  self._getData("model").o.comment[id_comment]}
		if (doEdit){
		    body.hide();
		    ed_args.doEdit = true;
		}
		$editor.editor(ed_args);
		$editor.bind("before_cleanup", function(){  
			if (doEdit){
			    body.show();
			}
		    });
	    }, 
	    set_model: function(model){
		this._setData("model", model);
		//for now, we don't register to receive any particular updates.
		model.register($.ui.view.prototype.get_adapter.call(this),  {});
	    },
	    update: function(action, payload, props){
		var self = this;
		$.L("[notepaneview] TODO updating:, ", action, payload, props);
	    }
	});
    $.widget("ui.notepaneView",V_OBJ );
    $.ui.notepaneView.defaults = $.extend({}, {});
    $.extend($.ui.notepaneView, {
	    defaults: {
		provides: ["notepane"], 
		    listens: {
		    file:null, 
		    page:null, 
			     note_hover: null,
			note_out: null, 
			     new_notes: null, 
			notes_loaded_for_file: null,
			sel_click: null
			
			}		    
	    },
		getter:$.ui.view.getter
		});
})(jQuery);
