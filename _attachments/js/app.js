/**
 * @author Benjamin Young <byoung@bigbluehat.com>
 * @copyright 2011 Couchbase, Inc
 * @license MIT
 */
(function() {
  window.Todo = Backbone.couch.Model.extend({
  });
  
  window.TodoList = Backbone.couch.Collection.extend({
    model: Todo,
    _db: Backbone.couch.db('support'),
    state: 'done',
    couch: function() {
      return {
        view: 'readme/by_state',
        startkey: [this.state],
        endkey: [this.state, {}],
        descending: false,
        include_docs: true,
        limit: 50
      }
    }
  });
  
  window.todos = new TodoList();

  $(document).ready(function() {
    window.TodoView = Backbone.View.extend({
      tagName: "li",
      className: 'item',
      template: $('#item-template').html(),
      render: function() {
        $(this.el).html($.mustache(this.template, this.model.toJSON()))
          .attr('id', this.model.id);
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

    window.Readme = Backbone.Router.extend({
      routes: {
        '': 'listByStatus',
        ':status': 'listByStatus'
      },
      
      initialize: function() {
        this.todoListView = new TodoListView({
          collection: window.todos,
        });
      },
      
      listByStatus: function(status) {
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
    $('.more').live('click', function(ev) {
      ev.preventDefault();
      $(ev.target).closest('li').find('.message').toggle('fast');
    });
  });
})(jQuery);