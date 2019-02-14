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
        freeSamples: null,
        message: 'Here are the samples',
        freeSampleCount: 0
      },
      relations: {
        freeSamples: FreeSamplesCollection
      },
      dataTypes: {
          freeSampleCount: Backbone.MozuModel.DataTypes.Int
      },
    });

    var FreeSamplesView = Backbone.MozuView.extend({
        templateName: 'modules/product/free-sample-widget/product-list-tiled',
        /*events: {
          'click #product-list-ul .mz-productdetail-addtocart': 'addToCart'
        },*/
        initialize: function(conf) {
          var me = this;
          console.log('Init called', conf);
          var freeSamplesCollection = new FreeSamplesCollection();
          this.model = new FreeSamplesModel( {
            freeSamples: freeSamplesCollection
          });

          api.get('products', "categoryId req " + conf.categoryId).then( function( categoryResponse ) {
            categoryResponse.data.items.forEach( function(product) {
              var newItem = new FreeSampleItem( {
                productCode: product.productCode,
                product: new ProductModels.Product(product)
              });
              freeSamplesCollection.add(newItem);
            });
            console.log('calling update');
            me.update();
          });
        },
        update: function() {
          console.log('Update called');
          var me = this;
          var cart = CartModels.Cart.fromCurrent();
          //console.log('Cart is', cart);
          var cartTotal = cart.attributes.subtotal;
          //console.log('Subtotal is' +  cartTotal);
          var freeSamplesCollection = me.model.get('freeSamples');
          var freeSamplesCount = 0;
          var cartItems = cart.get('items');
          cartItems.forEach( function(item) {
            var cartProductCode = item.get('product').get('productCode');
            // find this product in free samples and set it
            var sample = freeSamplesCollection.get(cartProductCode);
            if (sample) {
              sample.set('inCart', true);
              freeSamplesCount++;
            }
          });

          var setModel = function( message, count) {
            me.model.set('message', message);
            me.model.set('freeSamplesCount', count);
          };

          try {
            if (cartTotal < FREE_SAMPLE_THRESHOLD) {
              setModel(
                "Add $" + (FREE_SAMPLE_THRESHOLD - cartTotal) + " more for free shipping and " + FREE_SAMPLE_MAX + " free samples!",
                freeSamplesCount
              );
            }
            else if (freeSamplesCount < 3) {
              setModel(
                "You’ve earned 3 FREE SAMPLES. Choose them below.",
                freeSamplesCount
              );
            }
            else {
              setModel(
                "You have chosen your free samples!",
                freeSamplesCount
              );
            }
            me.render();
          }
          catch (e) {
            console.log(e);
          }
        },
        /*render: function() {
          console.log('render called');
        },*/
        addSampleToCart: function(_e, a, b, c) {
          var me = this;
          console.log('Add to cart');
          console.log('e', _e);
          console.log('a', a);
          console.log('b', b);
          console.log('c', c);

          var productCode = $(_e.currentTarget).data("mz-product-code");

          var itemsInCart = GlobalCart.getItemsCache();

          if(productCode && productCode !== ''){

              api.get('product', productCode).then(function(productResponse){
                  var product = new ProductModels.Product(productResponse.data);
                  product.on('addedtocart', function(cartitem) {
                      if (cartitem && cartitem.prop('id')) {
                          console.log('Calling update', me);
                          me.update();
                          CartMonitor.addToCount( product.get('quantity'), true);
                          MetricsEngine.trackDirectoryAddToCart(product, product.get('categories')[0], false, 1);
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

    return FreeSamplesView;

});
