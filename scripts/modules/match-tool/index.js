define([
  'modules/jquery-mozu',
  'underscore',
  'modules/backbone-mozu'
], function(
  $,
  _,
  Backbone
) {
  var __MATCHES = [
    {
      code: 'F30097D',
      name: 'Vitamin C Concentrate',
      benefit: 'Stuff',
      skin_care_system: 'Enlighted',
      product_type: 'Serum',
      description: 'This concentrated serum, containing pure 10% Vitamin C antioxidant, is packaged in protective single-dose capsules to enhance product freshness. This powerful antioxidant is an effective daily treatment to protect against drying environmental stressors.',
      ingredients: [
        '10% L-Ascorbic Acid (Vitamin C)'
      ],
      images: {
        front: '/resources/images/match-tool/F30097D.png',
        hero: '/cms/files/ENLIGHTEN_VITAMIN_C_CONCENTRATE_V1.jpg'
      },
      status: 'Matched',
      before: {
        name: 'VITAMIN C CONCENTRATE',
        image: '/resources/images/match-tool/before/F30097D-en.png'
      }
    },
    {
      code: 'F30119D',
      name: '',
      before: {
        name: 'SECUREWHITE® ANTI DARK CIRCLE COMPLEX',
        image: '/resources/images/match-tool/before/secure-white-anti-dark.png'
      },
      status: 'MATCHED'
    },
    {
      code: 'A',
      before: {
        name: 'A'
      },
      status: 'MATCHED'
    },
    {
      code: 'B',
      before: {
        name: 'B'
      },
      status: 'MATCHED'
    }
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

      this.options = _.map( __MATCHES, function( match ) {
        return {
          value: match.code,
          label: match.before.name
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
