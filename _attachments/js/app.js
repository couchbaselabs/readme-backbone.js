/**
 * @author Benjamin Young <byoung@bigbluehat.com>
 * @copyright 2011 Couchbase, Inc
 * @license MIT
 */
(function() {
  var db = Backbone.couch.db('support');

  window.Todo = Backbone.couch.Model.extend({
  });
  
  window.TodoList = Backbone.couch.Collection.extend({
    model: Todo,
    _db: db,
    state: 'done',
    couch: function() {
      return {
        view: 'readme/by_state',
        startkey: [this.state],
        endkey: [this.state, {}],
        descending: false,
        include_docs: true,
        reduce: false,
        limit: 50
      }
    }
  });
  
  window.TodoStatesList = Backbone.couch.Collection.extend({
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

  window.todos = new TodoList();
  window.states = new TodoStatesList();

  $(document).ready(function() {
    window.TodoView = Backbone.View.extend({
      tagName: "li",
      className: 'item',
      template: $('#item-template').html(),
      render: function() {
        $(this.el).html($.mustache(this.template, this.model.toJSON()))
          .attr('id', this.model.id)
          .addClass(this.model.get('rm_state'));
        return this;
      },
      initialize: function() {
        _.bindAll(this, 'render');
      }
    });
    
    window.TodoListView = Backbone.View.extend({
      render: function() {
        $('#items').empty();
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
        return this;
      },
      initialize: function() {
        _.bindAll(this, 'render');
        this.collection.bind('reset', this.render);
      }
    });

    // needs el passed in at construction time
    window.TodoStatesListView = Backbone.View.extend({
      render: function() {
        var self = this;
        _.each(this.collection.models[0].attributes, function(v, k) {
          $(self.el).find('li:has(a[href=#'+k+']) .count').html(v);
        });
        return this;
      },
      initialize: function() {
        _.bindAll(this, 'render');
        this.collection.bind('reset', this.render);
      }
    });

    window.Readme = Backbone.Router.extend({
      routes: {
        '': 'listByStatus',
        ':status': 'listByStatus'
      },
      
      initialize: function() {
        this.todoListView = new TodoListView({
          collection: window.todos,
        });
        this.statesView = new TodoStatesListView({
          collection: window.states,
          el: '#nav'
        });
      },
      
      listByStatus: function(status) {
        this.statesView.collection.fetch();
        if (status) {
          this.todoListView.collection.state = status;
        }
        this.todoListView.collection.fetch();
      }
    });
    
    window.App = new Readme();
    Backbone.history.start();
  });

  $(function() {
    $('.more, .header').live('click', function(ev) {
      if ($(ev.target).hasClass('more')) {
        ev.stopPropagation();
        ev.preventDefault();
      } else if (!$(ev.target).is('a')) {
        $(ev.target).closest('li').toggleClass('open')
          .find('.message').toggle('fast');
      }
    });
  });
})(jQuery);
