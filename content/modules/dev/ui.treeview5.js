/* treeView Plugin
 * Depends:
 *    ui.core.js
 *     ui.view.js
 *

 Author 
 cf AUTHORS.txt 

 License
 Copyright (c) 2010-2012 Massachusetts Institute of Technology.
 MIT License (cf. MIT-LICENSE.txt or http://www.opensource.org/licenses/mit-license.php)
*/
/*global jQuery:true */
(function($) {
    var V_OBJ = $.extend({},$.ui.view.prototype,{
        _init: function() {
        $.ui.view.prototype._init.call(this);
        var self = this;
        self.element.html("<div class='treeView-header'><button action='new_class'>New Class</button></div><div class='tree'/>");
        $("button[action=new_class]", self.element).click(function(){
            $.concierge.get_component("add_ensemble_menu")();
            });
    
        $.mods.declare({treeview5: {js: [], css: ["/content/modules/dev/ui.treeview.css"]}});
        $.mods.ready("treeview5", function(){});
        $.mods.declare({jstree: {js: ["/content/modules/jstree/jquery.jstree.js"], css: ["/content/modules/jstree/themes/default/style.css"]}});
        },
        _defaultHandler: function(evt){
        var self = this;
        // by default we listen to events directed to everyone
        switch (evt.type){
        case "hello": 
            self.element.append("got a hello event with value:"+evt.value +"<br/>" );
            break;
        case "foo": 
            break;
        }
        },
        set_model: function(model){
        var self=this;
        self._setData("model", model);
        model.register($.ui.view.prototype.get_adapter.call(this),  {folder: null, ensemble: null});    
        self._render();
        }, 
        _render: function(){
        var self=this;
        var model = self._getData("model");
        //build view: 
        var params =  self.options.admin ? {admin: true} : {};
        var ensemble = model.get("ensemble", params).items;
        var data = [];
        var subfolders = null;
        var children = null;
        var s_numfiles = null;
        var qry = null;
        for (var i in ensemble){
            children = [];
            subfolders  = model.get("folder", {id_ensemble: i}).items; 
            for (var j in subfolders){
            if (subfolders[j].id_parent==null){
                s_numfiles = (self.options.filestats) ? " <span class='numfiles'>"+model.get("file", {id_folder: j}).length() +"</span>" : "";
                children.push({data: $.E(subfolders[j].name) + s_numfiles, attr: {rel: "folder", id_item: j}, children: this._build_children(model, j)});
            }
            }
            s_numfiles = (self.options.filestats) ? " <span class='numfiles'>"+model.get("file", {id_ensemble: i, id_folder: null }).length() +"</span>" : "";
            data.push({data:  $.E(ensemble[i].name)+s_numfiles, children: children, attr: {title: $.E(ensemble[i].description),  rel: "ensemble", id_item: i}});
        }
        var tree_data = {
            plugins : [ "themes", "json_data", "ui" ],
            json_data : {data : data}, 
            core: {html_titles: true}
        };
        //var T = $("div.tree", self.element);

        $.mods.ready("jstree", function(){
            $("div.tree", self.element).jstree(tree_data).bind("select_node.jstree", function (e, data) {
                var o = data.rslt.obj;
                var id_item = o.attr("id_item");
                self._setData("selection", {rel: o.attr("rel"), id_item: id_item});
                $.concierge.trigger({type:o.attr("rel"), value:id_item});
                $.jstree._reference(o).toggle_node(o);
                }); 
            //restore selection of there was any: 
            var sel = self._getData("selection"); 
            if (sel){
                var o = $("li[rel="+sel.rel+"][id_item="+sel.id_item+"]", self.element);
                $.jstree._reference(o).toggle_node(o);
            }
            
            });
        },
        _build_children:  function(model, id_folder){
        var subfolders =  model.get("folder", {id_parent: id_folder}).items; 
        var children = [];
        var s_numfiles = null;
        for (var j in subfolders){

            s_numfiles = (this.options.filestats) ? " <span class='numfiles'>"+ model.get("file", {id_folder: j}).length()+"</span>" : "";
            children.push({data: $.E(subfolders[j].name)+s_numfiles, attr: {rel: "folder", id_item: j}, children: this._build_children(model, j)});

        }
        return children;        
        }, 
        _update: function(){
        /*
          var self = this;
          self.element.append("<p>_update request</p>");
        */
        },
        update: function(action, payload, items_fieldname){
        if (action === "add" || action === "remove"){
            this._render();
        }
        }
    });
             
    $.widget("ui.treeView",V_OBJ );
    $.ui.treeView.defaults = $.extend({}, {});
    $.extend($.ui.treeView, {
        defaults: {
        listens: {
            hello:null
            }    ,        
            admin: true, 
            "filestats": false
            },
        getter:$.ui.view.getter
        });
})(jQuery);
