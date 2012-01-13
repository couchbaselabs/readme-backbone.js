/**
 * @author Benjamin Young <byoung@bigbluehat.com>
 * @copyright 2011 Couchbase, Inc
 * @license MIT
 */
(function() {
  var db = Backbone.couch.db('support');

  var Todo = Backbone.couch.Model.extend({
  });
  
  var TodoList = Backbone.couch.Collection.extend({
    model: Todo,
    _db: db,
    state: 'done',
    couch: function() {
      var done = (this.state === 'done');
      return {
        view: 'readme/by_state',
        startkey: (done ? [this.state, {}] : [this.state]),
        endkey: (done ? [this.state] : [this.state, {}]),
        descending: (done ? true : false),
        include_docs: true,
        reduce: false,
        limit: 50
      };
    }
  });
  
  var TodoStatesList = Backbone.couch.Collection.extend({
    model: Backbone.couch.Model.extend({}),
    _db: db,
    couch: function() {
      return {
        view: 'readme/by_state',
        group_level: 1
      }
    },
    parse: function(resp) {
      var rv = {};
      _.each(resp, function(el, i) {
        rv[el.key[0]] = el.value;
      });
      return rv;
    }
  });

  var TodoHistoryList = Backbone.couch.Collection.extend({
    model: Backbone.couch.Model.extend({}),
    _db: db,
    couch: function() {
      return {
        view: 'readme/history',
        descending: true,
        include_docs: true,
        limit: 20
      };
    },
    parse: function(resp) {
      var rv = [];
      _.each(resp, function(r) {
        rv.unshift({when: myPretty(r.key[0]),
                    what: r._id,
                    who: r.key[1],
                    from: r.key[2],
                    to: r.value,
                    favicon: r.rm_favicon,
                    title: r.title,
                    // TODO: add individual item loading plus it's history
                    link: '#' + r.value
                   });
      });
      return rv;
    }
  });

  $(document).ready(function() {
    var TodoView = Backbone.View.extend({
      tagName: "li",
      className: 'item',
      template: $('#item-template').html(),
      render: function() {
        $(this.el).html($.mustache(this.template, this.model.toJSON()))
          .attr('id', this.model.id)
          .addClass(this.model.get('rm_state'))
          .find('.timestamp').text(function(i, t) {
            return myPretty(t);
          });
        return this;
      },
      initialize: function() {
        _.bindAll(this, 'render');
      }
    });
    
    var TodoListView = Backbone.View.extend({
      render: function() {
        $('#items').empty();
        if (this.collection.length > 0) {
          this.collection.each(function(todo) {
            var view = new TodoView({
              model: todo
            })
            $('#items').append(view.render().el);
          });
          $('.state').html(this.collection.state);
          $('#nav li:has(a[href=#' + this.collection.state + '])')
            .addClass('current')
            .siblings().removeClass('current');
        } else {
          $('#items').html('<li>There are currently no items with this status.');
        }
        return this;
      },
      initialize: function() {
        _.bindAll(this, 'render');
        this.collection.bind('reset', this.render);
      }
    });

    // needs el passed in at construction time
    var TodoStatesListView = Backbone.View.extend({
      render: function() {
        var self = this;
        if (_.keys(this.collection.models[0].attributes).length > 0) {
          _.each(this.collection.models[0].attributes, function(v, k) {
            $(self.el).find('li:has(a[href=#'+k+']) .count').html(v);
          });
        } else {
          $(self.el).find('.count').html(0);
        }
        return this;
      },
      initialize: function() {
        _.bindAll(this, 'render');
        this.collection.bind('reset', this.render);
      }
    });

    var HistoryView = Backbone.View.extend({
      tagName: 'li',
      template: $('#history-item-template').html(),
      render: function() {
        $(this.el).html($.mustache(this.template, this.model.toJSON()));
        return this;
      },
      initialize: function() {
        _.bindAll(this, 'render');
      }
    });

    // needs el passed in at construction time
    var TodoHistoryListView = Backbone.View.extend({
      render: function() {
        var $el = $(this.el).empty();
        this.collection.each(function(model) {
          var view = new HistoryView({
            model: model
          });
          $el.append(view.render().el);
        });
        return this;
      },
      initialize: function() {
        _.bindAll(this, 'render');
        this.collection.bind('reset', this.render);
      }
    });

    var Readme = Backbone.Router.extend({
      routes: {
        '': 'listByStatus',
        ':status': 'listByStatus'
      },
      
      initialize: function() {
        this.todoListView = new TodoListView({
          collection: new TodoList,
        });
        this.statesView = new TodoStatesListView({
          collection: new TodoStatesList,
          el: '#nav'
        });
        this.todoHistoryListView = new TodoHistoryListView({
          collection: new TodoHistoryList,
          el: '#history'
        });
      },
      
      listByStatus: function(status) {
        this.statesView.collection.fetch();
        if (status) {
          this.todoListView.collection.state = status;
        }
        this.todoListView.collection.fetch();
        this.todoHistoryListView.collection.fetch();
      }
    });
    
    window.App = new Readme();
    Backbone.history.start();
  });

  $(function() {
    $('.more, .header').live('click', function(ev) {
      if ($(ev.target).hasClass('more') || !$(ev.target).is('a')) {
        ev.stopPropagation();
        ev.preventDefault();
        $(ev.target).closest('li').toggleClass('open')
          .find('.message').toggle('fast');
      }
    });

    // TODO: Backbone Model + View this thing
    $(".statechange").live('click', function(ev) {
      var id = $(ev.target).closest('li').attr('id'),
          state =  $(ev.target).attr('title');

      ev.preventDefault();

      // If the item's already in the state of the button clicked, then we
      // assume it's going back to an 'unread' state.
      if ($(ev.target).hasClass(state)) {
        state = 'unread';
      }

      // POST to the set_state update handler to set the state.
      $.ajax({type: 'POST',
              url: db.uri + "_design/readme/_update/set_state/" + id,
              data: 'new_state=' + state,
              dataType: "json",
              complete: function(res) {
                  if (res.responseText === 'change') {
                      $('#'+id).hide('fast');
                  }
                  states.fetch();
              }});

      return false;
    });
  });
})(jQuery);
