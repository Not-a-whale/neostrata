/**
 * Unidirectional dispatch-driven collection views, for your pleasure.
 */
define([
    'backbone',
    'modules/jquery-mozu',
    'underscore',
    'modules/url-dispatcher',
    'modules/intent-emitter',
    'modules/get-partial-view',
    'modules/color-swatches',
     'modules/block-ui',
     'modules/models-product',
     'modules/api',
     'hyprlive',
     'modules/models-customer',
     "modules/cart-monitor",
     'modules/page-header/global-cart',
     "modules/metrics",
     'modules/models-cart',
], function(
  Backbone, $ , _, UrlDispatcher, IntentEmitter, getPartialView,colorSwatch,blockUiLoader, ProductModels, api, Hypr, CustomerModels, CartMonitor, GlobalCart, MetricsEngine, CartModels) {

    var FREE_SAMPLE_MAX = 3;
    var FREE_SAMPLE_THRESHOLD = 75;

    var FreeSampleItem = Backbone.MozuModel.extend({
      mozuType: 'freeSample',
      idAttribute: 'productCode',
      defaults: {
        inCart: false,
        product: null
      },
      relations: {
        product: ProductModels.Product
      }
    });

    var FreeSamplesCollection = Backbone.Collection.extend({
      model: FreeSampleItem
    });

    var FreeSamplesModel = Backbone.MozuModel.extend({
      mozuType: 'freeSamples',
      defaults: {
        freeSamples: new FreeSamplesCollection(),
        message: '',
        freeSamplesCount: 0,
        cart: null,
        showProducts: false
      },
      relations: {
        freeSamples: FreeSamplesCollection,
        cart: CartModels.Cart
      },
      dataTypes: {
          freeSamplesCount: Backbone.MozuModel.DataTypes.Int,
          showProducts: Backbone.MozuModel.DataTypes.Boolean

      },
      initialize: function(conf) {

        //console.log('Init model');
        var me = this;
        var freeSamplesCollection = this.get('freeSamples');

        api.get('products', "categoryId req " + conf.categoryId).then( function( categoryResponse ) {
          categoryResponse.data.items.forEach( function(product) {
            var newItem = new FreeSampleItem( {
              productCode: product.productCode,
              product: new ProductModels.Product(product)
            });
            freeSamplesCollection.add(newItem);
          });
          me.update();
        });
      },
      update: function() {
        //console.log('Update called');
        var me = this;
        var cart = me.get( 'cartModel' );
        var cartItems = cart.get('items');
        var cartTotal = cart.attributes.subtotal;

        me.set('freeSamplesCount', 0);

        cartItems.forEach( function(item) {

          if (cartTotal < FREE_SAMPLE_THRESHOLD && item.get('product').get('productType') === 'Free Sample') {

            cart.removeItem(item.get('id'));
          } else {

            var cartProductCode = item.get('product').get('productCode');

            me.setInCart(cartProductCode, true);
          }
        });

        me.setMessaging();
        me.trigger('updated', me);
      },
      setMessaging: function() {
        var me = this;

        var cart = me.get( 'cartModel' );
        var cartTotal = cart.attributes.subtotal;
        var freeSamplesCollection = me.get('freeSamples');
        var freeSamplesCount = me.get('freeSamplesCount');

        var message, showProducts = false;
        if (cartTotal < FREE_SAMPLE_THRESHOLD) {
          message = "Add $" + (FREE_SAMPLE_THRESHOLD - cartTotal) + " more for free shipping and " + FREE_SAMPLE_MAX + " free samples!";
        }
        else if (freeSamplesCount < 3) {
          message = "You’ve earned 3 FREE SAMPLES. Choose them below.";
          showProducts = true;
        }
        else {
          message = "You have chosen your free samples!";
        }
        me.set('message', message);
        me.set('showProducts', showProducts);
      },
      setInCart: function( productCode, inCartStatus ) {
        var me = this;
        var freeSamplesCollection = me.get('freeSamples');
        // find this product in free samples and set it
        var sample = freeSamplesCollection.get(productCode);
        if (sample) {
          sample.set('inCart', inCartStatus);
          me.set('freeSamplesCount', me.get('freeSamplesCount')+ (inCartStatus ? 1 : -1));
        }
      },
      itemAdded: function( productCode ) {
        var me = this;
        me.setInCart(productCode, true);
        me.setMessaging();
        me.trigger('updated', me);
      },
      itemRemoved: function( productCode ) {
        //console.log('Removing ' + productCode);
        var me = this;
        me.setInCart(productCode, false);
        me.setMessaging();
        me.trigger('updated', me);
      }
    });

    var FreeSamplesView = Backbone.MozuView.extend({
        templateName: 'modules/product/free-sample-widget/product-list-tiled',
        autoUpdate: [
            'showProducts',
            'freeSamples'
        ],
        /*events: {
          'click #product-list-ul .mz-productdetail-addtocart': 'addToCart'
        },*/
        initialize: function(conf) {
          //console.log('Init called', conf);
          this.model = conf.model;
          this.listenTo(this.model, 'updated', this.render);
        },
        render: function() {
          //console.log('render called', this.model);
          Backbone.MozuView.prototype.render.apply(this);
        },
        addSampleToCart: function(_e, a, b, c) {
          var me = this;

          var productCode = $(_e.currentTarget).data("mz-product-code");
          if(productCode && productCode !== ''){
            api.get('product', productCode).then(function(productResponse){
              var product = new ProductModels.Product(productResponse.data);
              product.on('addedtocart', function(cartitem) {
                  if (cartitem && cartitem.prop('id')) {
                      me.model.itemAdded(productCode);
                      me.model.get('cartModel').fetch();
                      // CartMonitor.addToCount( product.get('quantity'), true);
                  }
                  else {
                      product.trigger("error", { message: Hypr.getLabel('unexpectedError') });
                  }

              });
              product.addToCart();
            });
          }
        }

    });

    return {
      Model: FreeSamplesModel,
      View: FreeSamplesView
    };

});
