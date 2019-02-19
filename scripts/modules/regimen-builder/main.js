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
          //var productModel = ProductModels.Product(item);
          //item.productModel = productModel;  // just doing this now to avoid having to refactor all the way through
          PRODUCTS[item.productCode] = item;
        });
      }
    }
    catch ( err ) {
      console.warn( 'Bad or missing product data.' );
    }
  });

  var COMPREHENSIVE_STEPS = [
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

  var BASIC_STEPS = [
    COMPREHENSIVE_STEPS[0],
    COMPREHENSIVE_STEPS[3],
    COMPREHENSIVE_STEPS[4]
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
      buildSteps( regimen[0], COMPREHENSIVE_STEPS ),
      buildSteps( regimen[0], BASIC_STEPS ), //
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
        regimenType: 'basic',
        selection: summarizeSelection( REGIMENS[0], 'basic' ),
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
      },
      'click [data-role="regimenType"]': function( ev ) {
        ev.stopPropagation();
        this.selectRegimenType( $( ev.target ).attr( 'data-regimenType' ) );
      }
    },

    initialize: function(conf) {

      this.skinTypeToggled = false;
      this.skinTypeSelected = undefined;
      this.skinConcernToggled = false;
      this.skinConcernSelected = undefined;
      this.selectedRegimen = undefined;
      this.regimenType = conf.regimenType;
      this.lastRegimenType = undefined;

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

      this.$el.html( this.template({
        skinTypeOpen: this.skinTypeToggled, skinTypeSelected: this.skinTypeSelected,
        skinConcernOpen: this.skinConcernToggled, skinConcernSelected: this.skinConcernSelected,
        skinTypes: this.skinTypes, skinConcerns: this.skinConcerns,
        regimenType: this.regimenType
      }) );

      return this;
    },
    selectRegimenType: function( regimenType ) {
      console.log('Setting regimen type to: ' + regimenType);
      this.regimenType = regimenType;
      this.updateRegimen();
      this.render();
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
      if (this.skinTypeSelected && this.skinConcernSelected  && this.regimenType) {
        var newRegimen = this.calculateRegimen(this.skinTypeSelected, this.skinConcernSelected);
        if (this.selectedRegimen != newRegimen || this.regimenType != this.lastRegimenType) {
          this.selectedRegimen = newRegimen;
          this.lastRegimenType = this.regimenType;
          pushState(
            { skinType: this.skinTypeSelected[0], skinConcern: this.skinConcernSelected[0], regimenType: this.regimenType },
            this.skinTypeSelected[1] + ' / ' + this.skinConcernSelected[1],
            '?skin-type=' + this.skinTypeSelected[0] + '&skin-concern=' + this.skinConcernSelected[0] + '&regimen-type=' + this.regimenType
          );

          this.trigger( 'change', { selectedRegimen: this.selectedRegimen, regimenType: this.regimenType } );
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

      var regimenType = this.model.get( 'regimenType' );
      var productsColumn = regimenType == 'basic' ? 3 : 2;

      if ( regimen ) {
        var itemsInCart =  this.model.get('itemsInCart');
        this.$el.html( this.template( this.model.attributes ) );
        this.$( '[data-view="steps"]' )
          .html(
            _.map( regimen[productsColumn], function( step ) {
              console.log('checking if ' + step.product.productCode + ' is in ' + itemsInCart);
              var inCart = _.contains(itemsInCart, step.product.productCode);
              return new StepView().render( step, inCart ).el;
            })
          );
      }

      var productIds = _.reduce( regimen[productsColumn], function( acc, step ) {
        acc[step.product.productCode] = {
            url: step.product.url,
            containerId: 'BVRRInlineRating-' + step.product.productCode
        };

        return acc;
      }, {});

      if (productIds && productIds.length > 0) {
        $BV.ui( 'rr', 'inline_ratings', {
          productIds: productIds,
          containerPrefix: 'BVRRInlineRating'
        });
      }
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
          inCart: inCart,
          isPurchasable: !step.product.purchasableState || step.product.purchasableState.isPurchasable
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
        var regimenType = this.state.get( 'regimenType' );
        var step = $el.attr( 'data-value' );
        var checked = $el.prop( 'checked' );

        var isBasic = (regimenType == 'basic');
        var productColumn = isBasic ? 3 : 2;
        regimen[productColumn][step-1].included = checked;

        this.state.set({
          selection: summarizeSelection( regimen, regimenType  )
        });
      },
      'click [data-control="addToCart"]': function( ev ) {
        var self = this;
        var $el = $( ev.target );
        var selection = this.state.get('selection');
        console.log('Add to cart', selection);

        blockUiLoader.globalLoader();
        var itemsInCart = this.state.get('itemsInCart') || [];
        var productsAdded = [];
        var promises = _.map( selection.items, function(item) {
          var product = new ProductModels.Product(item.product);
          console.log('    : ', product);

          var productCode = product.get('productCode');
          var inCart = _.contains(itemsInCart, productCode);
          if (inCart) {
            return function(callback) {
              callback(null, 'alreadyInCart');
            };
          }

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
      var regimenType = getUrlParameter('regimen-type');

      this.selector = new Selector({
        el: this.$( '[data-view="selector"]' ),
        skinConcern: skinConcern,
        skinType: skinType,
        regimenType: regimenType
      }).render();
      this.regimen = new RegimenView({ el: this.$( '[data-view="regimen"]' ), model: this.state }).render();

      this.updateFromCart();

      this.selector.on( 'change', function( conf ) {
        var newRegimen = _.find( REGIMENS, function( item ) {
          return item[0] === conf.selectedRegimen;
        });
        if (!newRegimen) {
          console.log('Regimen not found: ' + conf.selectedRegimen);
        }
        else {
          console.log('Setting regimen to:' + conf.selectedRegimen);
        }

        self.state.set({
          current: newRegimen,
          selection: summarizeSelection( newRegimen, conf.regimenType),
          regimenType: conf.regimenType
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

  function buildSteps( slug, steps ) {
    return _.chain( steps )
      .map( function( step, index ) {
        var key = slug + 'Step' + ( index + 1 );
        var code = CONFIG[key];

        var product = PRODUCTS[code];
        return _.extend({}, step, {
          product: code && product,
          productContent: code && product && product.content,
          productCode: code,
          price: product && product.price,
          included: product && (!product.purchasableState || product.purchasableState.isPurchasable)
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

  function summarizeSelection( regimen, regimenType ) {
    var isBasic = (regimenType == 'basic');
    var productColumn = isBasic ? 3 : 2;
    var included = _.filter( regimen[productColumn], function( step ) {
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
