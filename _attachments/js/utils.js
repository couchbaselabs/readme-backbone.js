function rm_parseISO8601(timestamp) {
    var regex = new RegExp("^([\\d]{4})-([\\d]{2})-([\\d]{2})T([\\d]{2}):([\\d]{2}):([\\d]{2})Z?$");
    var matches = regex.exec(timestamp);
    var rv = null;
    if(matches != null) {
        rv = new Date(
            Date.UTC(
                parseInt(matches[1], 10),
                parseInt(matches[2], 10) - 1,
                parseInt(matches[3], 10),
                parseInt(matches[4], 10),
                parseInt(matches[5], 10),
                parseInt(matches[6], 10)
            )
        );
    } else {
        rv = new Date(timestamp);
    }
    if (rv === null) {
        console.log("Failed to parse", timestamp);
    }
    return rv;
}