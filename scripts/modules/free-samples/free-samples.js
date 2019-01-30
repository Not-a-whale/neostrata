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
        message: 'Here are the samples'
      },
      relations: {
        freeSamples: FreeSamplesCollection
      }
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
            console.log('Items In Cart: ' + itemsInCart);

            console.log('Adding to cart: ' + productCode);

            if(productCode && productCode !== ''){

                api.get('product', productCode).then(function(productResponse){
                    var product = new ProductModels.Product(productResponse.data);
                    console.log('product data: ' + product);
                    product.on('addedtocart', function(cartitem) {
                        if (cartitem && cartitem.prop('id')) {
                            //product.isLoading(true);
                            CartMonitor.addToCount( product.get('quantity'), true);
                            MetricsEngine.trackDirectoryAddToCart(product, product.get('categories')[0], false, 1);

                        } else {
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


          api.get('products', "categoryId req " + categoryId).then( function( categoryResponse ) {
            console.log('category data: ' + JSON.stringify(categoryResponse.data.items));

            categoryResponse.data.items.forEach( function(product) {
              console.log('Category item ' + product.productCode);

              var newItem = new FreeSampleItem( {
                productCode: product.productCode,
                product: new ProductModels.Product(product)
              });

              console.log('This is a product: ', product);
              console.log('----');
              console.log('This is a product typed: ', new ProductModels.Product(product));

              freeSamplesCollection.add(newItem);

            });

            var cartItems = cart.get('items');
            cartItems.forEach( function(item) {
              var cartProductCode = item.get('product').get('productCode');
              // find this product in free samples and set it
              var sample = freeSamplesCollection.get(cartProductCode);
              if (sample) {
                sample.set('inCart', true);
              }
            });

            try {
              var theModel = new FreeSamplesModel( {
                freeSamples: freeSamplesCollection,
                message: "Choose up to three samples!"
              });

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
