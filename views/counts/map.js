function(doc) {
    if (doc.rm_state) {
        emit(doc.rm_state, null);
    }
};
