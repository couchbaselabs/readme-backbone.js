function(doc) {
  if (doc.rm_history) {
    doc.rm_history.forEach(function(h) {
      emit([h.when, h.who.name, h.from], h.to);
    });
  }
}
