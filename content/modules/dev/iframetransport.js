(function($) {
    // This is the format of our data.
    // e:
    //   - source
    //   - data (=event):
    //      o type = {trigger | update | concierge}
    //      o body
    
    // trigger body:
    //         * type
    //         * value

    // update body:
    //         * action
    //         * payload
    //         * items_fieldname

    // concierge body:
    //         * name
    //         * arglist

    var use_json = true;
    var construct_trigger = function(name, value) {
        var send_event = {
            type: "trigger",
            body: {
                type: name,
                value: value
            }
        };

        return (use_json) ? JSON.stringify(send_event) : send_event;
    };

    var construct_update = function(action, payload, items_fieldname) {
        var send_event = {
            type: "update",
            body: {
                action: action,
                payload: payload,
                items_fieldname: items_fieldname
            }
        };
        return (use_json) ? JSON.stringify(send_event) : send_event;
    };

    var construct_concierge_call = function (name, arglist) {
        var send_event = {
            type: "concierge",
            body: {
                name: name,
                arglist: arglist
            }
        };
        return (use_json) ? JSON.stringify(send_event) : send_event;
    };

    var IFrameMessager = function (listener) {

        if (window.parent === window) {
            //return;
        }

        window.addEventListener("message", function (e) {
            // TODO: check and validate source
            if (e.data === "can-receive") { return; }
            var event = (typeof e.data === "string") ? JSON.parse(e.data) : e.data;
            listener(event);
        }, false);

        // instantiate our senders:
        this.trigger = function (name, value) {
            var message = construct_trigger(name, value);
            window.parent.postMessage(message, "*");
        };

        this.concierge = function (name, arglist) {
            var message = construct_concierge_call(name, arglist);
            window.parent.postMessage(message, "*");
        };

        window.parent.postMessage("can-receive", "*");

        return this;
    };

    var NBMessager = function (iframe, listener) {
        
        // by default queue messages until we get a 'can_receive' message from our IFrame
        var can_send = false;
        var send_queue = [];
        var send = function (data) {
            iframe.contentWindow.postMessage(data, "*");
        };
        var trySend = function (data) {
            if (!can_send) {
                send_queue.push(data);
                return;
            }
            send(data);
        };

        // First, instantiate receiver:
        window.addEventListener("message", function (e) {
            // TODO: check and validate source
            if (e.data === "can-receive") {
                can_send = true;
                // send anything that queued up
                send_queue.forEach(send);
                send_queue = [];
                return;
            }
            // Otherwise use our listener
            var event = (typeof e.data === "string") ? JSON.parse(e.data) : e.data;
            listener(event);
        }, false);

        // instantiate our senders:
        this.trigger = function (name, value) {
            var message = construct_trigger(name, value);
            trySend(message);
        };

        this.concierge = function (name, arglist) {
            var message = construct_concierge_call(name, arglist);
            trySend(message);
        };

        this.update = function (action, payload, items_fieldname) {
            var message = construct_update(action, payload, items_fieldname);
            trySend(message);
        };

        return this;
    };

    $.IFrameMessager = IFrameMessager;
    $.NBMessager = NBMessager;

})(NB$);
