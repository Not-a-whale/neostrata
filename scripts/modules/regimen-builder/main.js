require([
  'modules/jquery-mozu',
  'underscore',
  'modules/backbone-mozu'
], function(
  $,
  _,
  Backbone
) {
  var CONFIG = JSON.parse( $( '#regimen-builder-config' ).html() );
  var PRODUCTS = {};
  $( '[data-role="regimen-product"]' ).each( function( index, el ) {
    var json = $( el ).html();

    try {
      if ( !json.match( /^\s+$/ ) ) {
        _.each( JSON.parse( json ).items, function( item ) {
          PRODUCTS[item.productCode] = item;
        });
      }
    }
    catch ( err ) {
      console.warn( 'Bad or missing product data.' );
    }
  });

  var REGIMENS = [
    ['normal', 'Normal Skin'],
    ['dry', 'Dry Skin'],
    ['oily', 'Oily Skin'],
    ['sensitive', 'Sensitive Skin']
  ];

  var Selector = Backbone.View.extend({
    template: _.template( $( '#regimen-select-template' ).html() ),

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

      this.options = _.map( REGIMENS, function( item ) {
        return {
          value: item[0],
          label: item[1]
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
      var selection = _.find( REGIMENS, function( item ) {
        return item[0] === value;
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

  var RegimenView = Backbone.View.extend({
    template: _.template( $( '#regimen-template' ).html() ),

    render: function( regimen ) {
      console.log( 'Render:', regimen );

      return this;
    }
  });

  var App = Backbone.View.extend({
    initialize: function() {
      var self = this;

      this.state = new Backbone.Model();

      this.selector = new Selector({ el: this.$( '[data-view="selector"]' ) }).render();
      this.regimen = new RegimenView({ el: this.$( '[data-view="regimen"]' ) });

      this.selector.on( 'change', function( regimen ) {
        self.regimen.render( regimen );
      });
    }
  });

  $( '[data-widget="regimen-builder"]' ).each( function( i, $el ) {
    new App({ el: $el });
  });
});
