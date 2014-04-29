(function ($) {
    var _scrollTimerID=null;
    var _scrollCounter=0;

    var lastClicked = {set: [], clicked: null};

    var NBHTML = function() {
        var self = this;
        self.id = "docviewHtml5";
        self.$textarea = $("<textarea>").css({"opacity": "0", "position": "fixed", "top": "50px", "left": "50px", "z-index": -5}).appendTo( $("body") );

        var countChildChars = function(_char, _this) {
            var char = _char;

            // count text nodes as well (includes whitespace)
            $(_this).contents().each(function() {
                  if (this.nodeType === 1) {
                      $(this).attr("data_char", char);
                      countChildChars(char, this);
                  }
                  char += ($(this).text()).length;
            });
        };

        countChildChars(0, $("body")[0]);

        self.transport = new $.IFrameMessager(function (event) {

            if (event.type === "trigger") {

                if (event.body.type in self.listeners) {
                    (self.listeners[event.body.type]).call(self, event.body);
                }

            } else if (event.type === "update") {
                self.update(event.body.action, event.body.payload, event.body.items_fieldname);
            }

        });

        rangy.init();
        
        $(window).scroll(function(evt){
                var timerID = _scrollTimerID;
                if (timerID !== null){
                    window.clearTimeout(timerID);
                    _scrollTimerID =  null;
                }
                timerID = window.setTimeout(function(){
                    if (self.get_file) {
                        var arglist = [
                            "scrolling",
                            ["s", $("html").scrollTop(), $(window).height(), _scrollCounter++, $("body").height(), self.get_file ].join(",")
                        ];

                        self.concierge("logHistory", arglist);
                    }
                }, 300);               
            _scrollTimerID =  timerID;
        });
        
        // Wrap elements with nb-comment-fresh which is then selected by jQuery and operated on properly;
        // the styled element must have an nb-comment-highlight class.
        self.cssApplier = rangy.createCssClassApplier("nb-comment-fresh", { normalize: true });

        // Global key-down monitor
        //$(document).keydown(function (event) {
        $(document).on('keypress keyup keydown', function(event) {
            // If there are no current drafts, we don't interfere.
            if ($(".nb-placeholder").length === 0) {
                return true;
            }

            // If we are currently interacting with an input, button, or textarea, we don't interfere.
            if (document.activeElement.nodeType === "INPUT" ||
                document.activeElement.nodeType === "BUTTON" ||
                document.activeElement.nodeType === "TEXTAREA") {
                return true;
            }

            // If certain key combinations are being pressed, do not interfere.
            if (event.altKey === true || event.ctrlKey === true) {
                return true;
            }

            // If the key is an escape, we discard the draft if it is empty
            if (event.keyCode === 27) {
                self.trigger("discard_if_empty", {});
                return true;
            }

            // If the key is not a chracter, do not interfere.
            if (event.keyCode !== 13 && event.keyCode < 48 ||
               (event.keyCode > 90 && event.keyCode < 96) ||
               (event.keyCode > 111 && event.keyCode < 186)) {
                return true;
            }

            // Keypress only has characters pressed, so we do not neet check for
            // arrow keys, or CTRL+C and other combinations
            self.trigger("focus_thread", {});
            if (event.keyCode !== 13) {
                self.$textarea.focus();
                window.setTimeout(function () {
                    self.trigger("forward_to_editor", { content: self.$textarea.val() });
                    self.$textarea.val("");
                }, 50);
            }
        });

        // Initialize Highlighting Event
        $("body>*").not(".nb_sidebar").mouseup(function (event) {
            var sel = rangy.getSelection();

            if (sel.isCollapsed){
                self.trigger("discard_if_empty", {});
                return;
            }

            // must call before applyToRanges, otherwise sel is gone
            var element = event.target;

            if ($(element).hasClass("nb-comment-highlight")) {
                element = ($(element).parents("*:not(.nb-comment-highlight)"))[0];
            }

            var range = sel.saveCharacterRanges(element);

            var target = getElementXPath(element);

            self.insertPlaceholderAnnotation(sel);

            if ( $(element).attr("data_char") === undefined) {
                // we have a problem
                throw "targetdoes not have data_char attribute";
            }

            self.trigger("new_thread", {
                html5range:{
                    path1: target,
                    path2: range[0].backward,
                    offset1: range[0].characterRange.start, 
                    offset2: range[0].characterRange.end,
                    apparent_height: parseInt($(element).attr("data_char"), 10) +
                        Math.min(range[0].characterRange.start, range[0].characterRange.end)
                },
                suppressFocus: true
            });

            sel.restoreCharacterRanges(element, range);

        });

        // "Fix" all URLs to navigate top window
        var urls = [];
        $("a[href]").not("[target=_blank]").each(function () {
            if (this.href.replace(/#.*$/, "") === window.location.href.replace(/#.*$/, "")) {
                return;
            }
            $(this).attr("target", "_top");
            urls.push(this.href);
        });
        self.transport.request_data("urls", { urls: urls});

        // fix IE XPath implementation
        wgxpath.install();

        return this;
    };

    NBHTML.prototype.restore = function(loc) {
        var self = this;
        var sel = rangy.getSelection();
        sel.restoreCharacterRanges(
            getElementsByXPath(document, loc.path1)[0], 
            [{
                backward: loc.path2 === "true",
                characterRange: {
                    start: loc.offset1,
                    end: loc.offset2
                }
            }]
        );
        self.placeAnnotation(sel, loc);
    };
        
    NBHTML.prototype.restoreBatch = function(object, callback) {
        var self = this;
        var start = (new Date()).getTime();
        var fail = false;
        var current;

        for (var key in object) {
            current = (new Date()).getTime();
            if (current - start > 150) {
                fail = true;
                break;
            }

            self.restore(object[key]);
            delete object[key];
        }

        if (fail) {
            window.setTimeout(function() {
                self.restoreBatch();
            }, 10, object, callback);
            return;
        }
        callback();
    };

    NBHTML.prototype.update = function(action, payload, items_fieldname) {
        var self = this;
        var key;
        if (items_fieldname === "draft") {
            var draft;
            for (draft in payload.diff) { break; }

            if (action === "remove") {
                $(".nb-comment-highlight.nb-placeholder[id_item=" + draft + "]").contents().unwrap();
            } else if (action === "add") {
                $(".nb-comment-highlight.nb-placeholder").attr("id_item", draft);
            }

        }

        if (action === "remove" && items_fieldname === "location") {
            for (key in payload.diff) {
                $(".nb-comment-highlight[id_item=" + key + "]").contents().unwrap();
            }
        }

        if (action === "add" && items_fieldname === "html5location") {
            self.restoreBatch($.extend(true, {}, payload.diff), function(){ });
        }
    };

    NBHTML.prototype.listeners = {
        get_file: function(event) {
            this.get_file = event.get_file;
        },
        page: function(event){
            // _render();
        }, 
        note_hover: function(event){
            $(".nb-comment-highlight[id_item="+event.value+"]").addClass("hovered");
        }, 
        note_out: function(event){
            $(".nb-comment-highlight[id_item="+event.value+"]").removeClass("hovered");
        }, 
        visibility: function(event){
            // TODO
        },
        select_thread: function(event){
            $(".nb-comment-highlight.selected").removeClass("selected");
            $(".nb-comment-highlight[id_item="+event.value+"]").addClass("selected");

            var viewTop = $(window).scrollTop();

            // use window.innerHeight if available,
            // else use document.body.clientHeight,
            // else use documentElement.clientHeight
            var viewHeight =
                window.innerHeight || document.body.clientHeight || window.document.documentElement.clientHeight;
            var viewBottom =
                viewTop +
                (viewHeight) * 0.9;
            var elementTop = $(".nb-comment-highlight[id_item="+event.value+"]").offset().top;

            if (viewTop > elementTop || viewBottom < elementTop) {

                $("body, html").animate({
                    scrollTop: $(".nb-comment-highlight[id_item="+event.value+"]").offset().top - viewHeight / 4
                });
            }
        },
        update_urls: function (event) {
            $("a[href]").each(function () {
                var href = this.href;
                if (href in event.value) {
                    $(this).attr("href", event.value[href]);
                }
            });
        }
    };

    NBHTML.prototype.trigger = function(name, value) {
        var self = this;
        self.transport.trigger(name, value);
    };

    NBHTML.prototype.concierge = function(name, arglist) {
        var self = this;
        self.transport.concierge(name, arglist);
    };

    // must be called only on inner-most element
    var hasConflicts = function (element) {
        return ($(element).parents(".nb-comment-highlight").length > 0);
    };

    // TODO: refactor such that there is more code re-use between placeAnnotation
    // on the one hand, and insert/activatePlaceholderAnnotation on the other.
    NBHTML.prototype.placeAnnotation = function (selection, loc) {
        var self = this;
        var uid = loc.id_location;

        // quit if annotation already placed
        if ($(".nb-comment-highlight[id_item=" + uid + "]").length > 0) {
            return;
        }

        // apply nb-comment-fresh to ranges
        self.cssApplier.applyToSelection(selection);
        selection.removeAllRanges();

        // jQuery Treatment
        $("span.nb-comment-fresh.nb-comment-highlight").
            removeClass("nb-comment-fresh").
            wrapInner('<span class="nb-comment-fresh" />');
        $("span.nb-comment-fresh")
            .addClass("nb-comment-highlight")
            .removeClass("nb-comment-fresh")
            .attr("id_item", uid)
            .hover(
                function(){ self.trigger("note_hover", uid); },
                function(){ self.trigger("note_out", uid); })
            .click(
                function (event) {
                    if (!rangy.getSelection().isCollapsed){ return;}

                    if (hasConflicts(this)) {
                        var ids = [];
                        var id = 0;

                        ids.push($(this).attr("id_item"));

                        $(this).parents(".nb-comment-highlight").each(function () {
                                ids.push($(this).attr("id_item"));
                        });

                        if ($(lastClicked.set).not(ids).length === 0 && $(ids).not(lastClicked.set).length === 0) {
                            for (id = 0; id < ids.length; id++) {
                                if (ids[id] === lastClicked.clicked) { break; }
                            }
                            id = (id + 1) % ids.length;
                        }

                        self.trigger("select_thread", ids[id]);
                        lastClicked = {set: ids, clicked: ids[id]};

                    } else {
                        self.trigger("select_thread", uid);
                    }
                    event.stopPropagation();
                });
    };

    NBHTML.prototype.insertPlaceholderAnnotation = function (selection) {
        var self = this;

        // apply nb-comment-fresh to ranges
        self.cssApplier.applyToSelection(selection);
        selection.removeAllRanges();

        // jQuery Treatment
        $("span.nb-comment-fresh.nb-comment-highlight").
            removeClass("nb-comment-fresh").
            wrapInner('<span class="nb-comment-fresh" />');
        $("span.nb-comment-fresh")
            .addClass("nb-comment-highlight")
            .addClass("nb-placeholder")
            .removeClass("nb-comment-fresh")
            .attr("id_item", 0);

        // remove placeholder comment after 0.25 seconds if we do not receive a "draft created" event (i.e. the concierge
        // did not allow the creation of the draft). We check this by seeing if id_item is still 0.
        window.setTimeout(function() {
            $(".nb-placeholder[id_item=0]").contents().unwrap();
        }, 250);
    };

    NBHTML.prototype.clearAnnotations = function () {
        $(".nb-comment-highlight").contents().unwrap();
    };

    var trim = function (text) {
        return text.replace(/^\s*|\s*$/g, "");
    };

    var trimLeft = function (text) {
        return text.replace(/^\s+/, "");
    };

    var trimRight = function (text) {
        return text.replace(/\s+$/, "");
    };

    // ************************************************************************************************
    // XPath

    /**
     * Gets an XPath for an element which describes its hierarchical location.
     */
    var getElementXPath = function (element) {
        if (element && element.id){
            return '//*[@id="' + element.id + '"]';
        }
        else{
            return getElementTreeXPath(element);
        }
    };

    var getElementTreeXPath = function (element) {
        var paths = [];

        // Use nodeName (instead of localName) so namespace prefix is included (if any).
        for (; element && element.nodeType === 1; element = element.parentNode) {
            var index = 0;
            var tagName, pathIndex, fullName;
            var terminate = false;

            if (element.id) {
                fullName = '/*[@id="' + element.id + '"]';
                terminate = true;
            } else {

                for (var sibling = element.previousSibling; sibling; sibling = sibling.previousSibling) {
                    // Ignore document type declaration.
                    if (sibling.nodeType === Node.DOCUMENT_TYPE_NODE){
                        continue;
                    }

                    if (sibling.nodeName === element.nodeName){
                        ++index;
                    }
                }

                tagName = element.nodeName.toLowerCase();
                pathIndex = (index ? "[" + (index + 1) + "]" : "");
                fullName = tagName + pathIndex;

            }

            paths.splice(0, 0, fullName);

            if (terminate) {
                break;
            }
        }

        return paths.length ? "/" + paths.join("/") : null;
    };

    var getElementsByXPath = function (doc, xpath) {
        var nodes = [];

        try {
            var result = doc.evaluate(xpath, doc, null, XPathResult.ANY_TYPE, null);
            for (var item = result.iterateNext() ; item; item = result.iterateNext()){
                nodes.push(item);}
        }
        catch (exc) {
            // Invalid xpath expressions make their way here sometimes.  If that happens,
            // we still want to return an empty set without an exception.
        }

        return nodes;
    };

    ///------------------///
    NB$(function () {
        var html = new NBHTML();
    });

})(NB$);
