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
        templateName: 'modules/product/free-sample-widget/product-list-tiled'
    });

    function factory(conf) {

        var _$body = conf.$body;
        var _dispatcher = UrlDispatcher;

        var categoryId = conf.$body.data('mz-free-samples');


        /*directory Add-To-Cart action */
        var directoryAddToCart = IntentEmitter(_$body,
                                               ['click #product-list-ul .mz-productdetail-addtocart',
                                                'click #more-list-ul .mz-productdetail-addtocart'],
                                               directoryAddToCartAction);

        function directoryAddToCartAction(_e){
            var productCode = $(_e.currentTarget).data("mz-product-code");

            var itemsInCart = GlobalCart.getItemsCache();

            if(productCode && productCode !== ''){

                api.get('product', productCode).then(function(productResponse){
                    var product = new ProductModels.Product(productResponse.data);
                    product.on('addedtocart', function(cartitem) {
                        if (cartitem && cartitem.prop('id')) {
                            //product.isLoading(true);
                            CartMonitor.addToCount( product.get('quantity'), true);
                            MetricsEngine.trackDirectoryAddToCart(product, product.get('categories')[0], false, 1);
                        }
                        else {
                            product.trigger("error", { message: Hypr.getLabel('unexpectedError') });
                        }
                        return location.reload();
                    });
                    product.addToCart();
                });
            }
        }

        $(document).ready(function() {
          var cart = CartModels.Cart.fromCurrent();
          var freeSamplesCollection = new FreeSamplesCollection();
          //console.log('Cart is', cart);
          var cartTotal = cart.attributes.subtotal;
          //console.log('Subtotal is' +  cartTotal);


          api.get('products', "categoryId req " + categoryId).then( function( categoryResponse ) {
            categoryResponse.data.items.forEach( function(product) {
              var newItem = new FreeSampleItem( {
                productCode: product.productCode,
                product: new ProductModels.Product(product)
              });
              freeSamplesCollection.add(newItem);
            });

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

            try {
              var theModel;
              if (cartTotal < FREE_SAMPLE_THRESHOLD) {
                theModel = new FreeSamplesModel( {
                  freeSamples: null,
                  message: "Add $" + (FREE_SAMPLE_THRESHOLD - cartTotal) + " more for free shipping and " + FREE_SAMPLE_MAX + " free samples!",
                  freeSamplesCount: freeSamplesCount
                });
              }
              else if (freeSamplesCount < 3) {
                theModel = new FreeSamplesModel( {
                  freeSamples: freeSamplesCollection,
                  message: "You’ve earned 3 FREE SAMPLES. Choose them below.",
                  freeSamplesCount: freeSamplesCount
                });
              }
              else {
                theModel = new FreeSamplesModel( {
                  freeSamples: null,
                  message: "You have chosen your free samples!",
                  freeSamplesCount: freeSamplesCount
                });
              }
              var theView = new FreeSamplesView({
                  el: _$body, //$('[mz-free-samples]'),
                  model: theModel
              });
              theView.render();
            }
            catch (e) {
              console.log(e);
            }
          });
        });
    }

    return {

        createFreeSamplesViews: factory
    };

});
