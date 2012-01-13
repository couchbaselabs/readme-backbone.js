function(doc) {
    if (doc.rm_state && doc.rm_history) {
        emit([doc.rm_state, doc.rm_history[doc.rm_history.length-1].when], null);
    } else if (doc.rm_state && doc.rm_updated) {
        emit([doc.rm_state, doc.rm_updated], null);
    }
};