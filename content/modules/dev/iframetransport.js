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

    var construct_data_request = function (name, value) {
        var send_event = {
            type: "data_request",
            body: {
                name: name,
                value: value
            }
        };
        return (use_json) ? JSON.stringify(send_event) : send_event;
    };

    var IFrameMessager = function (listener) {

        var target;
        var can_send = false;

        if (window.parent === window) {
            target = function() {
                return $("#nb-iframe")[0].contentWindow;
            };
        } else {
            target = function() {
                return window.parent; 
            };
            can_send = true;
        }

        var send_queue = [];
        var send = function (data) {
            target().postMessage(data, "*");
        };
        var trySend = function (data) {
            if (!can_send) {
                send_queue.push(data);
                return;
            }
            send(data);
        };

        window.addEventListener("message", function (e) {
            // TODO: check and validate source
            if (e.data === "can-receive") {
                can_send = true;
                // send anything that queued up
                send_queue.forEach(send);
                send_queue = [];
                return;
            }
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

        this.request_data = function (name, value) {
            var message = construct_data_request(name, value);
            trySend(message);
            target().postMessage(message, "*");
        };

        if (window.parent !== window) {
            window.parent.postMessage("can-receive", "*");
        }

        return this;
    };

    var NBMessager = function (target, display_iframe, listener) {

        // by default queue messages until we get a 'can_receive' message from our IFrame
        var can_send = !display_iframe;

        var send_queue = [];
        var send = function (data) {
            target().postMessage(data, "*");
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

        if (window.parent !== window) {
            window.parent.postMessage("can-receive", "*");
        }

        return this;
    };

    $.IFrameMessager = IFrameMessager;
    $.NBMessager = NBMessager;

})(NB$);
