/*global NB:true NB$:true $:true rangy:true alert:true wgxpath:true jQuery:true getElementCSSSelector:true console:true */
(function(GLOB){
    
    if ("NB$" in window){
        var $ = NB$;
    }

    var $str        = "NB$" in window ? "NB$" : "jQuery";
    var comments = {};
    var tempUid = 0;
    var cssApplier = null;

    var _render = function(){
        var locs =  NB.pers.store.o.html5location; 
        for (var lid in locs) {
            var sel = rangy.getSelection();
            var obj = locs[lid];
            sel.restoreCharacterRanges(getElementsByXPath(document, obj.path1)[0], 
                                       [{backward: obj.path2 === "true",
                                                   range: {
                                                   start: obj.offset1,
                                                   end: obj.offset2
                                               }
                                           }]);
            drawAnnotation(sel, obj);
        }
    };

    GLOB.html = {
        id: "docviewHtml5"
    };

    GLOB.html.init = function () {
        $.concierge.addListeners(GLOB.html,{
                page: function(evt){
                    _render();
                }, 
                note_hover: function(event){
                    //console.warn("TODO", event);
                    $(".nb-comment-highlight[id_item="+event.value+"]").addClass("hovered");
                }, 
                note_out: function(event){
                    //console.warn("TODO", event);
                    $(".nb-comment-highlight[id_item="+event.value+"]").removeClass("hovered");
                }, 
                visibility: function(event){
                    console.warn("TODO", event);
                },
                select_thread: function(event){
                    $(".nb-comment-highlight.selected").removeClass("selected");
                    $(".nb-comment-highlight[id_item="+event.value+"]").addClass("selected");
                }
            }, 
            GLOB.html.id);

        rangy.init();

        // Wrap elements with nb-comment-fresh which is then selected by jQuery and operated on properly;
        // the styled element must have an nb-comment-highlight class.
        cssApplier = rangy.createCssClassApplier("nb-comment-fresh", { normalize: true });

        // Initialize Hilighting Event
        $("#content").mouseup(function (event) {
                var sel = rangy.getSelection();

                if (sel.isCollapsed){
                    return;
                }

                // must call before applyToRanges, otherwise sel is gone
                var element = event.target;

                if ($(element).hasClass("nb-comment-highlight")) {
                    element = ($(element).parents("*:not(.nb-comment-highlight)"))[0];
                }

                // create temporary uid
                var uid = "t-" + (tempUid++).toString(16);
                var newcomment = comments[uid] = { id: uid, target: getElementXPath(element), range: sel.saveCharacterRanges(element) };

                drawAnnotation(sel, uid);
                $.concierge.trigger({type: "new_thread", value: {html5range:{
                                path1: newcomment.target,
                                    path2: newcomment.range[0].backward,
                                    offset1: newcomment.range[0].range.start, 
                                    offset2: newcomment.range[0].range.end
                            }}});
            });

        // Bind window resize event to ordering
        $(window).resize(recalculateOrdering);

        //Possible addition to init:
        // fix IE XPath implementation
        wgxpath.install();
    };

    // must be called only on inner-most element
    var hasConflicts = function (element) {
        return ($(element).parents(".nb-comment-highlight").length > 0);
    };

    var drawAnnotation = function (selection, loc) {
        var uid = loc.id_location;

        // apply nb-comment-fresh to ranges
        cssApplier.applyToSelection(selection);
        selection.removeAllRanges();

        // jQuery Treatment
        $("span.nb-comment-fresh.nb-comment-highlight").removeClass("nb-comment-fresh").wrapInner('<span class="nb-comment-fresh" />');
        $("span.nb-comment-fresh").addClass("nb-comment-highlight").removeClass("nb-comment-fresh").attr("id_item", uid).hover(
                                                                                                                               function(){$.concierge.trigger({type:"note_hover", value: uid});}, 
                                                                                                                               function(){$.concierge.trigger({type:"note_out", value: uid});}).click(
               function (event) {
                   if (!rangy.getSelection().isCollapsed){ return;}

                   if (hasConflicts(this)) {
                       var ids = {};
                       ids[$(this).attr("id_item")] = true;
                       $(this).parents(".nb-comment-highlight").each(function () {
                               ids[$(this).attr("id_item")] = true;
                           });
                       alert(JSON.stringify(ids));
                   } else {
                       $.concierge.trigger({type:"select_thread", value: uid});
                   }
                   event.stopPropagation();
               });
    };

    var recalculateOrdering = function () {
        for (var uid in comments) {
            comments[uid].docPosition = $("span.nb-comment-highlight[id_item=" + uid + "]").first().offset();
        }
    };

    GLOB.html.restoreAnnotations = function () {
        for (var uid in comments) {
            var sel = rangy.getSelection();
            var obj = comments[uid];
            sel.restoreCharacterRanges(getElementsByXPath(document, obj.target)[0], obj.range);
            drawAnnotation(sel, uid);
        }
    };

    GLOB.html.restoreNBAnnotations = function(){
        var locs =  NB.pers.store.o.html5location; 
        for (var lid in locs) {
            var sel = rangy.getSelection();
            var obj = locs[lid];
            sel.restoreCharacterRanges(getElementsByXPath(document, obj.path1)[0], 
                                       [{backward: obj.path2 === "true",
                                                   range: {
                                                   start: obj.offset1,
                                                   end: obj.offset2
                                               }
                                           }]);
            drawAnnotation(sel, obj);
        }
    };
    
    GLOB.html.clearAnnotations = function () {
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
            for (var sibling = element.previousSibling; sibling; sibling = sibling.previousSibling) {
                // Ignore document type declaration.
                if (sibling.nodeType === Node.DOCUMENT_TYPE_NODE){
                    continue;
                }

                if (sibling.nodeName === element.nodeName){
                    ++index;
                }
            }

            var tagName = element.nodeName.toLowerCase();
            var pathIndex = (index ? "[" + (index + 1) + "]" : "");
            paths.splice(0, 0, tagName + pathIndex);
        }

        return paths.length ? "/" + paths.join("/") : null;
    };

    var getElementCSSPath = function (element) {
        var paths = [];

        for (; element && element.nodeType === 1; element = element.parentNode) {
            var selector = getElementCSSSelector(element);
            paths.splice(0, 0, selector);
        }

        return paths.length ? paths.join(" ") : null;
    };
    
    var cssToXPath = function (rule) {
        var regElement = /^([#.]?)([a-z0-9\\*_\-]*)((\|)([a-z0-9\\*_\-]*))?/i;
        var regAttr1 = /^\[([^\]]*)\]/i;
        var regAttr2 = /^\[\s*([^~=\s]+)\s*(~?=)\s*"([^"]+)"\s*\]/i; //";
    var regPseudo = /^:([a-z_\-])+/i;
    var regCombinator = /^(\s*[>+\s])?/i;
    var regComma = /^\s*,/i;

    var index = 1;
    var parts = ["//", "*"];
    var lastRule = null;

    while (rule.length && rule !== lastRule) {
        lastRule = rule;

        // Trim leading whitespace
        rule = trim(rule);
        if (!rule.length){
            break;}

        // Match the element identifier
        var m = regElement.exec(rule);
        if (m) {
            if (!m[1]) {
                // XXXjoe Namespace ignored for now
                if (m[5]){
                    parts[index] = m[5];}
                else{
                    parts[index] = m[2];}
            }
            else if (m[1] === '#'){
                parts.push("[@id='" + m[2] + "']");}
            else if (m[1] === '.'){
                parts.push("[contains(concat(' ',normalize-space(@class),' '), ' " + m[2] + " ')]");
            }
            rule = rule.substr(m[0].length);
        }

        // Match attribute selectors
        m = regAttr2.exec(rule);
        if (m) {
            if (m[2] === "~="){
                parts.push("[contains(@" + m[1] + ", '" + m[3] + "')]");}
            else{
                parts.push("[@" + m[1] + "='" + m[3] + "']");
            }
            rule = rule.substr(m[0].length);
        }
        else {
            m = regAttr1.exec(rule);
            if (m) {
                parts.push("[@" + m[1] + "]");
                rule = rule.substr(m[0].length);
            }
        }

        // Skip over pseudo-classes and pseudo-elements, which are of no use to us
        m = regPseudo.exec(rule);
        while (m) {
            rule = rule.substr(m[0].length);
            m = regPseudo.exec(rule);
        }

        // Match combinators
        m = regCombinator.exec(rule);
        if (m && m[0].length) {
            if (m[0].indexOf(">") !== -1){
                parts.push("/");}
            else if (m[0].indexOf("+") !== -1){
                parts.push("/following-sibling::");}
            else{
                parts.push("//");
            }
            index = parts.length;
            parts.push("*");
            rule = rule.substr(m[0].length);
        }

        m = regComma.exec(rule);
        if (m) {
            parts.push(" | ", "//", "*");
            index = parts.length - 1;
            rule = rule.substr(m[0].length);
        }
    }

    var xpath = parts.join("");
    return xpath;
    };

var getElementsBySelector = function (doc, css) {
    var xpath = cssToXPath(css);
    return getElementsByXPath(doc, xpath);
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

var getRuleMatchingElements = function (rule, doc) {
    var css = rule.selectorText;
    var xpath = cssToXPath(css);
    return getElementsByXPath(doc, xpath);
};
        jQuery(function(){NB.html.init();});

})(NB);