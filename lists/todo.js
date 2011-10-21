function(head, req) {
    // !json templates.head
    // !json templates.item
    // !json templates.tail

    var state = req.query.state || 'unread';
    var title = "items in " + state + " state";

    provides("html", function() {
        var row;

        var data = {
            title: title,
            mainid: "items"
        };

        var Mustache = require("vendor/couchapp/lib/mustache");
        var path = require("vendor/couchapp/lib/path").init(req);

        send(Mustache.to_html(templates.head, data));
        send("<h1>" + title + "</h1>");
        send('<ul id="items">\n');

        while( (row = getRow()) ) {
            send(Mustache.to_html(templates.item, row.doc));
        }
        send("</ul>\n");
        send(Mustache.to_html(templates.tail, data));
    });
}
