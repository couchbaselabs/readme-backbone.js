#!/usr/bin/env python

import os
import sys
import time
import json
import signal
import urllib
import base64
import hashlib
import traceback

import couchdb

import feedparser

SERVER = os.getenv("COUCHDB_SERVER") or 'http://127.0.0.1:5984/'

DB = couchdb.Server(SERVER)[os.getenv("COUCHDB") or 'readme']

ISO8601 = "%Y-%m-%dT%H:%M:%S"

def is_plain(x):
    return type(x) in [float, int, str, unicode]

def cleanupThing(thing):
    if isinstance(thing, dict):
        rv = {}
        for k, v in thing.iteritems():
            newv = cleanupThing(v)
            if newv:
                rv[k] = newv
        return rv
    elif isinstance(thing, list):
        return [cleanupThing(x) for x in thing]
    elif is_plain(thing):
        return thing
    else:
        pass
        # print "NOT CONVERTING: %s (%s)" % (thing, type(thing))

def favicon(src):
    return 'http://www.google.com/s2/favicons?domain=' + src.split('/')[2]

def handle(src, e):

    doc = cleanupThing(e)
    doc['_id'] = hashlib.md5(doc['id'].encode('utf-8')).hexdigest()
    doc['rm_src'] = src
    doc['rm_favicon'] = favicon(src)
    doc['rm_state'] = 'unread'
    doc['rm_updated'] = time.strftime("%Y-%m-%dT%H:%M:%S", e.updated_parsed)

    return doc

if __name__ == '__main__':

    urls = set(sys.argv[1:])

    try:
        for u in DB.view('app/sources', group=True):
            urls.add(u.key)
    except:
        # Don't worry about it if we can't find the old ones.
        pass

    for src in urls:
        signal.alarm(10)
        f = feedparser.parse(src)

        docs = []

        for e in f.entries:
            try:
                signal.alarm(30)
                docs.append(handle(src, e))
            except:
                traceback.print_exc()

        DB.update(docs)
