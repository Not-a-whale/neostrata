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
    template: _.template( $( '#match-select-option-template' ).html() ),
    placeholder: _.template( $( '#match-select-placeholder-template' ).html() ),

    initialize: function() {
      this.$input = this.$( 'select' );
    },

    render: function() {
      var self = this;

      this.$input.html( [self.placeholder()]
          .concat( _.map( __MATCHES, function( match ) {
            return self.template({ match: match });
      })));

      return this;
    }
  });

  var SideBySideView = Backbone.View.extend({
    template: _.template( $( '#match-side-by-side-template' ).html() ),

    className: 'products',

    render: function() {
      this.$el.html( this.template( this.model ) );

      return this;
    }
  });

  var DetailView = Backbone.View.extend({
    template: _.template( $( '#match-detail-template' ).html() ),

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
      'change [data-control="selector"]':  function( ev ) {
        var value = _.find( __MATCHES, function( item ) { return item.code === ev.target.value; });

        this.model.set({ current: value });
        console.log( 'Selected:', value );

        this.$sidebyside.append( new SideBySideView({ model: value }).render().el );
      }
    },

    initialize: function() {
      this.model = new State();

      this.selector = new SelectorView({ el: this.$( '[data-view="selector"]' ) }).render();
      this.detail = new DetailView({
        el: this.$( '[data-view="detail"]' ),
        model: this.model
      });

      this.$sidebyside = this.$( '[data-view="side-by-side"]' );
    },

    render: function() {

    }
  });

  $( '[data-widget="match-tool"]' ).each( function( i, $el ) {
    new App({ el: $el });
  });

  return App;
});
