/* docView Plugin 
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
(function($) {
    var V_OBJ = $.extend({},$.ui.view.prototype,{
        _create: function() {
            $.ui.view.prototype._create.call(this);
            var self = this;
            var $iframe = $("<iframe>");
            self.element.append($iframe);
            self.iframe = $iframe[0];
            self.element.addClass("htmlView");
            self.transport = new $.NBMessager(self.iframe, function (event) {
                // event:
                //   o type = {trigger | update | concierge}
                //   o body

                // trigger body:
                //      * type
                //      * value

                // update body:
                //      * action
                //      * payload
                //      * items_fieldname

                // concierge body:
                //      * name
                //      * arglist
                switch (event.type) {
                    case "trigger":
                        $.concierge.trigger({type: event.body.type, value: event.body.value});
                        break;
                    case "update":
                        throw "unexpected call to 'update'";
                    case "concierge":
                        $.concierge[event.body.name].apply($.concierge, event.body.arglist);
                        break;
                    default:
                        throw "unexpected " + event.type;
                }
            });
            $(window).focus(function () {
                window.console.log("Window Focused");
                $.concierge.trigger({ type: "focus_thread", value: {} });
            });
        },
        _defaultHandler: function(evt){
            var self = this;
            var id_source = self._id_source;
            var model = self._model;
            if (id_source !== $.concierge.get_state("file")){
                return;
            }
            self.transport.trigger(evt.type, evt.value);

        },
        update: function(action, payload, items_fieldname){
            var self = this;
            self.transport.update(action, payload, items_fieldname);
        }, 
        select: function() {
        }, 
        set_model: function(model, init_event){
            var self=this;

            model.register(
                $.ui.view.prototype.get_adapter.call(this), {
                    location: null,
                    draft: null,
                    html5location: null
                });

            //build view: 
            var id_source = $.concierge.get_state("file");
            self._id_source =  id_source; 
            self._model =  model;

            self._generate_contents();

            if (init_event){
                $.concierge.trigger(init_event);
            } else {
                $.concierge.trigger({type:"page", value: 1});
            }

            if ($.concierge.activeView === null){
                $.concierge.activeView = self; //init. 
            }
        },
        _keydown: function (event) {
        },
        _generate_contents: function(){
            /*
             * generates content-- only called once when the filename is found
             */
            var self = this;
            var id_source = self._id_source;
            var model = this._model;
            var file = model.o.file[id_source];
            var url = model.get("html5info", {}).first().url;

            self.iframe.src = url;

        }, 
        _render: function(){
        }, 
        _render_one: function(page){
        }
    });
    
    $.widget("ui.docViewHtml",V_OBJ );
    $.ui.docViewHtml.prototype.options = {
        loc_sort_fct: function (o1, o2) {
            return o1.top - o2.top;
        },
        provides: ["doc"], 
        listens: {
            note_hover: null, 
            note_out: null, 
            visibility: null, 
            global_editor: null, 
            select_thread: null
        }
    };
})(jQuery);
