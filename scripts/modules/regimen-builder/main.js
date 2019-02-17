/* global $BV */
require([
  'modules/jquery-mozu',
  'underscore',
  "async",
  'modules/backbone-mozu',
  'modules/api',
  'modules/models-product',
  'modules/cart-monitor',
  'modules/block-ui'
], function(
  $,
  _,
  async,
  Backbone,
  API,
  ProductModels,
  CartMonitor,
  blockUiLoader
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

  // this is skin-type.skin-concern that then points to the regimen to show
  var SKIN_CONCERNS = [
    ['aging','Aging'],
    ['fine-lines','Fine Lines & Wrinkles'],
    ['dry','Dry or Scaly Skin'],
    ['acne','Acne & Blemishes'],
    ['dark-circles','Dark Circles & Crows Feet'],
    ['uneven','Uneven / Dark Spots'],
    ['lax','Lax or Sagging Skin'],
    ['blotchy','Blotchy'],
    ['keratosis-pilaris','Keratosis Pilaris'],
    ['dull','Dull Skin'],
    ['psoriasis', 'Psoriasis']

  ];

  var SKIN_TYPES = [
    ['normal', 'Normal Skin'],
    ['dry', 'Dry Skin'],
    ['oily', 'Oily Skin'],
    ['sensitive', 'Sensitive Skin']
  ];

  var REGIMEN_LOOKUP = {
    'normal': {
      'aging': 'skinActive',
      'fine-lines': 'skinActive',
      'dry': 'restore',
      'acne': 'clarify',
      'dark-circles': 'enlighten',
      'uneven': 'enlighten',
      'lax': 'skinActive',
      'blotchy': 'restore',
      'keratosis-pilaris': 'restore',
      'dull': 'skinActive',
      'psoriasis': 'psorent'
    },
    'sensitive': {
      'psoriasis': 'psorent'
    },
    'oily': {
      'aging': 'clarify',
      'fine-lines': 'clarify',
      'dry': 'restore',
      'acne': 'clarify',
      'dark-circles': 'enlighten',
      'uneven': 'enlighten',
      'lax': 'skinActive',
      'blotchy': 'restore',
      'keratosis-pilaris': 'resurface',
      'dull': 'resurface',
      'psoriasis': 'psorent'
    },
    'dry': {
      'psoriasis': 'psorent'
    }
  };

  var REGIMEN_DEFAULT = 'restore';

  var REGIMENS = _.map([
    ['skinActive', 'Skin Active'],
    ['resurface', 'Resurface'],
    ['restore', 'Restore'],
    ['clarify', 'Clarify'],
    ['enlighten', 'Enlighten'],
    ['correct', 'Correct'],
    ['psorent', 'Psorent'],
  ], function( regimen ) {
    return regimen.concat([
      buildSteps( regimen[0] ),
      CONFIG[regimen[0] + 'CategoryPath']
    ]);
  });

  var PRODUCT_TILE = _.template( $( '#regimen-product-template' ).html() );

  console.log( 'Config:', CONFIG );
  console.log( 'Regimens:', REGIMENS );

  var State = Backbone.Model.extend({
    defaults: function() {
      return {
        current: REGIMENS[0],
        selection: summarizeSelection( REGIMENS[0] ),
        itemsInCart: []
      };
    }
  });

  var SUPPORTS_HISTORY = window.history && typeof window.history.pushState === 'function';
  function pushState(state, title, url) {
    if (SUPPORTS_HISTORY) {
      history.pushState(state, title, url);
    }
  }

  function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    var results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
  }

  var Selector = Backbone.View.extend({
    template: _.template( $( '#regimen-select-template' ).html() ),

    events: {
      'click [data-role="wrapperSkinType"]': function( ev ) {
        ev.stopPropagation();
        this.toggleSkinType( !this.skinTypeToggled );
      },
      'click [data-role="wrapperSkinConcern"]': function( ev ) {
        ev.stopPropagation();
        this.toggleSkinConcern( !this.skinConcernToggled );
      },
      'click [data-skinType]': function( ev ) {
        this.selectSkinType( $( ev.target ).attr( 'data-skinType' ) );
      },
      'click [data-skinConcern]': function( ev ) {
        this.selectSkinConcern( $( ev.target ).attr( 'data-skinConcern' ) );
      }
    },

    initialize: function(conf) {

      this.skinTypeToggled = false;
      this.skinTypeSelected = undefined;
      this.skinConcernToggled = false;
      this.skinConcernSelected = undefined;
      this.selectedRegimen = undefined;

      this.skinTypes = _.map( SKIN_TYPES, function( item ) {
        return {
          value: item[0],
          label: item[1]
        };
      });
      this.skinConcerns = _.map( SKIN_CONCERNS, function( item ) {
        return {
          value: item[0],
          label: item[1]
        };
      });

      if (conf.skinType) {
        this.skinTypeSelected = _.find(SKIN_TYPES, function(item) {
           return (item[0]===conf.skinType);
        });
      }
      if (conf.skinConcern) {
        this.skinConcernSelected = _.find(SKIN_CONCERNS, function(item) {
           return (item[0]===conf.skinConcern);
        });
      }


      document.addEventListener( 'click', this.clear.bind( this ) );
    },

    render: function() {
      var self = this;

      this.$el.html( this.template({ skinTypeOpen: this.skinTypeToggled, skinTypeSelected: this.skinTypeSelected, skinConcernOpen: this.skinConcernToggled, skinConcernSelected: this.skinConcernSelected, skinTypes: this.skinTypes, skinConcerns: this.skinConcerns }) );

      return this;
    },
    calculateRegimen: function( skinType, skinConcern ) {
      console.log('Look for regimen for: ' + skinType[0] + '/' + skinConcern[0]);
      var regimenKey = REGIMEN_LOOKUP[skinType[0]] ? REGIMEN_LOOKUP[skinType[0]][skinConcern[0]] : REGIMEN_DEFAULT;
      if (!regimenKey) {
        regimenKey = REGIMEN_DEFAULT;
      }
      return regimenKey;
    },
    toggleSkinType: function( value ) {
      this.skinTypeToggled = value;
      this.render();
    },
    updateRegimen: function() {
      if (this.skinTypeSelected && this.skinConcernSelected) {
        var newRegimen = this.calculateRegimen(this.skinTypeSelected, this.skinConcernSelected);
        if (this.selectedRegimen != newRegimen) {
          this.selectedRegimen = newRegimen;

          pushState(
            { skinType: this.skinTypeSelected[0], skinConcern: this.skinConcernSelected[0] },
            this.skinTypeSelected[1] + ' / ' + this.skinConcernSelected[1],
            '?skin-type=' + this.skinTypeSelected[0] + '&skin-concern=' + this.skinConcernSelected[0]
          );

          this.trigger( 'change', this.selectedRegimen );
        }
      }
    },
    selectSkinType: function( value ) {
      var selection = _.find( SKIN_TYPES, function( item ) {
        return item[0] === value;
      });
      if ( selection !== this.skinTypeSelected ) {
        this.skinTypeSelected = selection;
        // look up the regimen if we have the details we need
        this.updateRegimen();
      }
      this.render();
    },

    toggleSkinConcern: function( value ) {
      this.skinConcernToggled = value;
      this.render();
    },

    selectSkinConcern: function( value ) {
      var selection = _.find( SKIN_CONCERNS, function( item ) {
        return item[0] === value;
      });

      if ( selection !== this.skinConcernSelected ) {
        this.skinConcernSelected = selection;
        // look up the regimen if we have the details we need
        this.updateRegimen();
      }

      this.render();
    },

    clear: function() {
      this.toggleSkinType( false );
      this.toggleSkinConcern( false );

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
        var itemsInCart =  this.model.get('itemsInCart');
        this.$el.html( this.template( this.model.attributes ) );
        this.$( '[data-view="steps"]' )
          .html(
            _.map( regimen[2], function( step ) {
              console.log('checking if ' + step.product.productCode + ' is in ' + itemsInCart);
              var inCart = _.contains(itemsInCart, step.product.productCode);
              return new StepView().render( step, inCart ).el;
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

    render: function( step, inCart ) {
      this.$el.html( this.template( _.extend(
        {},
        step,
        {
          product: PRODUCT_TILE( _.extend({}, PRODUCT_DEFAULTS, step.product ) )
        },
        {
          inCart: inCart
        }
      )));

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

        regimen[2][step-1].included = checked;

        this.state.set({
          selection: summarizeSelection( regimen )
        });
      },
      'click [data-control="addToCart"]': function( ev ) {
        var self = this;
        var $el = $( ev.target );
        var selection = this.state.get('selection');
        console.log('Add to cart', selection);

        blockUiLoader.globalLoader();
        var productsAdded = [];
        var promises = _.map( selection.items, function(item) {
          var product = new ProductModels.Product(item.product);
          console.log('    : ', product);

          var productCode = product.get('productCode');

          return function(callback) {
            console.log('  inside  : ', product);
            product.on('addedtocart', function(cartitem) {
                if (cartitem && cartitem.prop('id')) {
                  console.log('Added: ', cartitem);
                  productsAdded.push(productCode);
                }
                else {
                    console.log('Error adding to cart');
                    //product.trigger("error", { message: Hypr.getLabel('unexpectedError') });
                }
                callback(null, cartitem);
            });
            product.addToCart();
          };
        });
        var errors = { "items": [] };
        async.series(promises,
          function(err, results) {
            console.log('Results', results);
            CartMonitor.addToCount( results.length, false);
            var resp = results.reduce(
              function(flag, value) {
                return flag && results[0] === value;
              },
              true
            );
            if (resp === true) {
              //window.productView.model.trigger('error', { message: Hypr.getLabel('selectValidOption') });
              blockUiLoader.unblockUi();
              return;
            }
            self.updateFromCart();
            blockUiLoader.unblockUi();
          }
        );
      }
    },


    initialize: function() {
      var self = this;

      this.state = new State();

      var skinType = getUrlParameter('skin-type');
      var skinConcern = getUrlParameter('skin-concern');

      this.selector = new Selector({
        el: this.$( '[data-view="selector"]' ),
        skinConcern: skinConcern,
        skinType: skinType
      }).render();
      this.regimen = new RegimenView({ el: this.$( '[data-view="regimen"]' ), model: this.state }).render();

      this.updateFromCart();

      this.selector.on( 'change', function( regimenKey ) {
        var newRegimen = _.find( REGIMENS, function( item ) {
          return item[0] === regimenKey;
        });
        if (!newRegimen) {
          console.log('Regimen not found: ' + regimenKey);
        }
        else {
          console.log('Setting regimen to:' + regimenKey);
        }
        self.state.set({
          current: newRegimen,
          selection: summarizeSelection( newRegimen )
        });
      });
    },
    updateFromCart: function() {
      var self = this;
      API.get( 'cart' ).then( function(resp) {
        var cart = resp;
        var itemsInCart = _.map(cart.data.items, function(item) {
          return item.product.productCode;
        });
        self.state.set( {
          'itemsInCart': itemsInCart
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
          productContent: code && PRODUCTS[code] && PRODUCTS[code].content,
          productCode: code,
          price: PRODUCTS[code] && PRODUCTS[code].price,
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
      count: included.length,
      items: included
    };
  }
});
