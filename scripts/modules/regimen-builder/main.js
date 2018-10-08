/* global $BV */
require([
  'modules/jquery-mozu',
  'underscore',
  'modules/backbone-mozu',
  'modules/api'
], function(
  $,
  _,
  Backbone,
  API
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
        $( '[data-widget="regimen-builder"]' ).each( function( i, $el ) {
          new App({ el: $el });
        });
      });
  });

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

  var STEPS = [
    {
      type: 'CLEANSER',
      sub: 'AM/PM',
      description: 'A cleanser is the first step to a successful skincare routine. Our cleansers are pH balanced to target the skin’s natural moisture barrier and are designed to leave your skin clean, fresh and comfortable.'
    },
    {
      type: 'TONER',
      sub: '',
      description: 'Our high-strength toner solutions are specially formulated treatments for those needing an exfoliation boost to smooth skin or help unclog pores.'
    },
    {
      type: 'SERUM',
      sub: '',
      description: 'Concentrated and power packed, serums help address your skin concerns head on. Featuring high concentrations of clinically-proven ingredients in light and easily absorbed textures, our serums are scientifically developed to enhance your skincare results.'
    },
    {
      type: 'DAY',
      sub: 'Moisturizers with SPF',
      description: 'From hydration to anti-wrinkle and firming, this category offers you a range of moisturizers that can take you through the day with both UV protection and daily skincare benefits.'
    },
    {
      type: 'NIGHT',
      sub: 'PM',
      description: 'When you are asleep, your skin experiences its regeneration cycles. Our nighttime products take advantage of the sleep phase to maximize your skincare regimen.'
    },
    {
      type: 'EYE',
      sub: 'PM',
      description: 'Discover the options and results that our eye care products can offer. From dark circles, wrinkles to puffiness, these products specifically target your eye concerns to make your eyes look younger.'
    },
    {
      type: 'Regimen Boosters',
      sub: 'Use to Maximize Regimen Results',
      description: 'Now professional grade skincare is yours in these at-home procedures that are results driven and easy to use.'
    }
  ];

  var REGIMENS = _.map([
    ['normal', 'Normal Skin'],
    ['dry', 'Dry Skin'],
    ['oily', 'Oily Skin'],
    ['sensitive', 'Sensitive Skin']
  ], function( regimen ) {
    return regimen.concat([
      buildSteps( regimen[0] )
    ]);
  });

  var PRODUCT_TILE = _.template( $( '#regimen-product-template' ).html() );

  console.log( 'Config:', CONFIG );
  console.log( 'Regimens:', REGIMENS );

  var State = Backbone.Model.extend({
    defaults: function() {
      return {
        current: REGIMENS[0],
        selection: summarizeSelection( REGIMENS[0] )
      };
    }
  });

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

    initialize: function() {
      this.model.on( 'change', this.render.bind( this ) );
    },

    render: function() {
      var regimen = this.model.get( 'current' );

      if ( regimen ) {
        this.$el.html( this.template( this.model.attributes ) );
        this.$( '[data-view="steps"]' )
          .html(
            _.map( regimen[2], function( step ) {
              return new StepView().render( step ).el;
            })
          );
      }

      var productIds = _.reduce( regimen[2], function( acc, step ) {
        acc[step.product.productCode] = {
            url: step.product.url,
            containerId: 'BVRRInlineRating-' + step.product.productCode
        };

        return acc;
      }, {});

      $BV.ui( 'rr', 'inline_ratings', {
        productIds: productIds,
        containerPrefix: 'BVRRInlineRating'
      });

      return this;
    }
  });

  var PRODUCT_DEFAULTS = {
    content: {},
    mainImage: {}
  };

  var StepView = Backbone.View.extend({
    template: _.template( $( '#regimen-step-template' ).html() ),

    className: 'block flex-swing',

    render: function( step ) {
      this.$el.html( this.template( _.extend({}, step, {
        product: PRODUCT_TILE( _.extend({}, PRODUCT_DEFAULTS, step.product ) )
      })));

      return this;
    }
  });

  var App = Backbone.View.extend({
    events: {
      'change [data-control="include"]': function( ev ) {
        var $el = $( ev.target );

        var regimen = this.state.get( 'current' );
        var step = $el.attr( 'data-value' );
        var checked = $el.prop( 'checked' );

        console.log( 'Changed:', step, checked );

        regimen[2][step-1].included = checked;

        this.state.set({
          selection: summarizeSelection( regimen )
        });
      }
    },

    initialize: function() {
      var self = this;

      this.state = new State();

      this.selector = new Selector({ el: this.$( '[data-view="selector"]' ) }).render();
      this.regimen = new RegimenView({ el: this.$( '[data-view="regimen"]' ), model: this.state }).render();

      this.selector.on( 'change', function( regimen ) {
        self.state.set({
          current: regimen,
          selection: summarizeSelection( regimen )
        });
      });
    }
  });

  function buildSteps( slug ) {
    return _.chain( STEPS )
      .map( function( step, index ) {
        var key = slug + 'Step' + ( index + 1 );
        var code = CONFIG[key];

        return _.extend({}, step, {
          product: code && PRODUCTS[code],
          included: true
        });
      })
      .filter( function( step ) {
        return step.product;
      })
      .map( function( step, index ) {
        return _.extend({}, step, {
          number: index + 1
        });
      })
      .value();
  }

  function summarizeSelection( regimen ) {
    var included = _.filter( regimen[2], function( step ) {
      return step.included;
    });

    var cost = _.reduce( included, function( memo, step ) {
      return memo + step.product.price.price;
    }, 0 );

    return {
      cost: cost,
      count: included.length
    };
  }
});
