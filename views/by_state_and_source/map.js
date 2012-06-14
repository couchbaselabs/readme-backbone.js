function(doc) {
  if (doc.link) {
    var domain = getDomain(doc.link);
    if (doc.rm_state && doc.rm_history) {
        emit([doc.rm_state, domain, doc.rm_history[doc.rm_history.length-1].when], null);
    } else if (doc.rm_state && doc.rm_updated) {
        emit([doc.rm_state, domain, doc.rm_updated], null);
    }
  }

  function getDomain(url) {
    return url.match(/:\/\/([a-zA-Z0-9.]*)/)[1];
  };
};
