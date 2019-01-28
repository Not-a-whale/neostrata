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
     "modules/metrics"
], function(Backbone, $ , _, UrlDispatcher, IntentEmitter, getPartialView,colorSwatch,blockUiLoader, ProductModels, api, Hypr, CustomerModels, CartMonitor, GlobalCart, MetricsEngine) {

    function factory(conf) {

        var _$body = conf.$body;
        var _dispatcher = UrlDispatcher;


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
                    // return location.reload();
                });
            }

        }

        function getItemsInCart() {
          return GlobalCart.getItemsCache();
        }
    }

    $(document).ready(function() {

        $('body').click(function(e){
            var self = $(this);

        });
    });

    return {
        createFacetedCollectionViews: factory
    };

});
