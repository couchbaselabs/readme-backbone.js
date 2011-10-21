function(doc, req) {

    function ISODateString(d){
        function pad(n){return n<10 ? '0'+n : n;}
        return d.getUTCFullYear()+'-'
            + pad(d.getUTCMonth()+1)+'-'
            + pad(d.getUTCDate())+'T'
            + pad(d.getUTCHours())+':'
            + pad(d.getUTCMinutes())+':'
            + pad(d.getUTCSeconds())+'Z';
    }

    var old_state = doc['rm_state'];
    doc['rm_state'] = req.form.new_state;
    var h = doc.rm_history || [];
    h.push({who: req.userCtx, when: ISODateString(new Date()),
            from: old_state, to: req.form.new_state});
    doc.rm_history = h;
    return [doc, (old_state === req.form.new_state) ? "nochange" : "change"];
}
