define([
  'modules/jquery-mozu',
  'underscore',
  'modules/backbone-mozu'
], function(
  $,
  _,
  Backbone
) {
  var __MATCHES = [];

  try {
    __MATCHES = JSON.parse( $( '#match-tool-catalog' ).html() );
  }
  catch ( err ) {
    console.error( 'Error parsing catalog data.', err );
  }

  var __DROPDOWN = [
    // Tuples of [LABEL, CODE]
    ['ANTIAGING SERUM', 'F30165D'],
    ['YOUTH FACTOR GF TOTAL REGENERATING SERUM', 'F30138X'],
    ['GLYCOLIC RENEWAL™ BODY SMOOTHING LOTION', 'F30140D'],
    ['SECUREWHITE® BRIGHTENING SERUM', 'F30160D'],
    ['SECUREWHITE® ANTI DARK CIRCLE COMPLEX', 'F30119D'],
    ['BRIGHTENING PEEL SOLUTION DUO', ''],
    ['SKIN RENEWAL PEEL SOLUTION', 'F30113D'],
    ['SKIN RESURFACTING DUO', 'F30101D'],
    ['OIL FREE GEL CLEANSER', 'F30098D'],
    ['AQUAYOUTH® FILLING ANTI-WRINKLE CREAM', 'F30107D'],
    ['ACNE CLEAR™ CLARIFYING GEL CLEANSER', 'F30142D'],
    ['OIL FREE MATIFYING FLUID', 'F30143D'],
    ['Wrinkle Repair Moisturizing Cream SPF 30', 'F30149D'],
    ['Antiaging Cream SPF 15 with Peptide Stem Cells', ''],
    ['PURIFYING SOLUTION', 'F30145D'],
    ['Protective Lotion Mineral Sunscreen SPF 45', 'F30164D'],
    ['ACNE CLEAR™ BLEMISH SPOT GEL', 'F30144D'],
    ['YOUTH FACTOR TOTAL REGENERATING CREAM', 'F30136D'],
    ['ACNE CLEAR™ CLARIFYING SOLUTION', 'F30110D'],
    ['ALL-IN-ONE NIGHT SERUM', 'F30102D'],
    ['ALL-IN-ONE EYE SERUM', 'F30104D'],
    ['ANTIAGING PEEL SOLUTION', 'F30112D'],
    ['BRIGHTENING PEEL SOLUTION', 'F30111D'],
    ['FIRMALIFT® FIRMING ANTI-WRINKLE CREAM', 'F30114D'],
    ['GLYCOLIC RENEWAL™ ANTIOXIDANT SMOOTHING SERUM', 'F30105D'],
    ['GLYCOLIC RENEWAL™ SMOOTHING CREAM', 'F30132D'],
    ['GLYCOLIC RENEWAL™ 10% SMOOTHING LOTION', 'F30133D'],
    ['SKIN BRIGHTENER SERUM', 'F30161D'],
    ['NIGHT REPAIR CREAM', 'F30106D'],
    ['VITAMIN C CONCENTRATE', 'F30097D'],
    ['DON’T SEE YOUR FAVOURITE PRODUCT?', '']
  ];

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
      this.$el.html( this.template( this.model.get( 'current' ) ) );
    }
  });

  var App = Backbone.View.extend({
    events: {
      'change':  function( ev ) {
        console.log( 'CHANGE:', ev );


      }
    },

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

  $( '[data-widget="match-tool"]' ).each( function( i, $el ) {
    new App({ el: $el });
  });

  return App;
});
