/* global $BV */
define([
  'modules/jquery-mozu',
  'underscore',
  'modules/backbone-mozu',
  'modules/api',
  'hyprlive'
], function(
  $,
  _,
  Backbone,
  API,
  Hypr
) {
  API.get( 'entityList', {
      listName: 'bvsettings@mzint',
      id: API.context.site
  }).then( function( res ) {
    var data = res.data.items[0];
    var staging = data.environment != 'Staging' ? '' : '-stg';
    var locale = API.context.locale.replace( "-", "_" );
    var script = "//display" + staging + ".ugc.bazaarvoice.com/static/" + data.clientName + "/"+ data.deploymentZone +"/" + locale + "/bvapi.js";

    $.getScript( script )
      .done( function() {
        $( '[data-widget="match-tool"]' ).each( function( i, $el ) {
          new App({ el: $el });
        });
      });
  });

  var __MATCHES = [];

  try {
    __MATCHES = JSON.parse( $( '#match-tool-catalog' ).html() );
  }
  catch ( err ) {
    console.error( 'Error parsing catalog data.', err );
  }

  var __DROPDOWN = [];

  try {
    __DROPDOWN = JSON.parse( $( '#match-tool-selector' ).html() );
  }
  catch ( err ) {
    console.error( 'Error parsing match data.', err );
  }

  __DROPDOWN = __DROPDOWN
    .filter( function( item ) {
      return item[1];
    })
    .sort( function( a, b ) {
      return a[0].localeCompare( b[0] );
    })
    .concat([
      [ Hypr.getLabel('dontSeeYourProduct'), '']
    ]);

  var State = Backbone.Model.extend({
    defaults: function() {
      return {
        current: null
      };
    }
  });

  var SelectorView = Backbone.View.extend({
    template: _.template( $( '#match-select-template' ).html() ),

    events: {
      'click [data-role="wrapper"]': function( ev ) {
        ev.stopPropagation();

        this.toggle( !this.toggled );
      },

      'click [data-option]': function( ev ) {
        this.select( $( ev.target ).attr( 'data-option' ) );
      }
    },

    initialize: function() {
      this.toggled = false;
      this.selected = undefined;

      this.options = _.map( __DROPDOWN, function( item ) {
        return {
          value: item[1],
          label: item[0]
        };
      });

      document.addEventListener( 'click', this.clear.bind( this ) );
    },

    render: function() {
      var self = this;

      this.$el.html( this.template({ open: this.toggled, selected: this.selected, options: this.options }) );

      return this;
    },

    toggle: function( value ) {
      this.toggled = value;
      this.render();
    },

    select: function( value ) {
      var selection = _.find( __MATCHES, function( match ) {
        return match.code === value;
      });

      if ( selection !== this.selected ) {
        this.trigger( 'change', selection );
      }
      this.selected = selection;

      this.render();
    },

    clear: function() {
      this.toggle( false );
    }
  });

  var MatchView = Backbone.View.extend({
    template: _.template( $( '#match-match-template' ).html() ),

    initialize: function() {
      var self = this;

      this.model.on( 'change', function() {
        self.render();
      });
    },

    render: function() {
      var current = this.model.get( 'current' );

      this.$el.html( current ? this.template( current ) : '' );

      if ( current ) {
        var productIds = {};
        productIds[current.code] = {
          url: '/p/' + current.code,
          containerId: 'BVRRInlineRating-' + current.code
        };

        $BV.ui( 'rr', 'inline_ratings', {
          productIds: productIds,
          containerPrefix: 'BVRRInlineRating'
        });
      }
    }
  });

  var App = Backbone.View.extend({
    initialize: function() {
      var self = this;

      this.model = new State();

      this.selector = new SelectorView({ el: this.$( '[data-view="selector"]' ) }).render();
      this.match = new MatchView({
        el: this.$( '[data-view="match"]' ),
        model: this.model
      });

      this.selector.on( 'change', function( selection ) {
        self.model.set({ current: selection });
      });
    }
  });

  return App;
});
