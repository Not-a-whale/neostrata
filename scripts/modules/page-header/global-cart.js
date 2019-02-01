define([
    'modules/backbone-mozu',
    'modules/jquery-mozu',
    "modules/api",
    "hyprlive",
    'underscore',
    "modules/models-product"
], function(Backbone, $, Api, Hypr, _, ProductModels) {

    var globalCartRelatedProducts = Hypr.getThemeSetting('globalCartRelatedProducts'),
        globalCartRelatedProductsSize = Hypr.getThemeSetting('globalCartRelatedProductsSize'),
        globalCartMaxItemCount = Hypr.getThemeSetting('globalCartMaxItemCount'),
        globalCartHidePopover = Hypr.getThemeSetting('globalCartHidePopover'),
        coerceBoolean = function(x) {
            return !!x;
        };
    var GlobalCartView = Backbone.MozuView.extend({
        templateName: "modules/page-header/global-cart-flyout",
        initialize: function() {
            var me = this;
        },
        render: function() {
            var me = this;
            Backbone.MozuView.prototype.render.apply(this);
        },
        showRelatedProducts: function(productCollection) {
            var me = this;
            var productCodes = [];
            for (var i = 0; i < productCollection.length; i++) {
                var currentProduct = productCollection[i].product;
                if (currentProduct && currentProduct.properties) {
                    for (var x = 0; x < currentProduct.properties.length; x++) {
                        if (currentProduct.properties[x].attributeFQN == 'tenant~product-upsell') {
                            var temp = _.pluck(currentProduct.properties[x].values, "value");
                            productCodes = productCodes.concat($.grep(temp || [], coerceBoolean));

                        }
                    }
                }
            }
            //console.log("productCodes", productCodes);
            var filter = _.map(productCodes, function(c) {
                return "ProductCode eq " + c;
            }).join(' or ');
            //console.log("filter", filter);
            Api.get("search", { filter: filter, pageSize : globalCartRelatedProductsSize}).then(function(collection) {
                //console.log("collection.data",collection.data);
                var template = 'Widgets/misc/product-related-listing';
                var RelatedProductsView = Backbone.MozuView.extend({
                    templateName: template
                });
                var relatedProductsCollection = new ProductModels.ProductCollection(collection.data);
                var relatedProductsView = new RelatedProductsView({
                    model: relatedProductsCollection,
                    el: me.$el.find('.related-products')
                });
                relatedProductsView.render();
                relatedProductsView.$el.find('img').height(150);
                setTimeout(function(){
                    $('#global-cart .related-products .product-listing-container .mz-productdetail-conversion-buttons .add-to-cart-container .mz-productdetail-addtocart').click(function(){
                        var productCode = $(this).data('mzProductCode');
                        if(productCode && productCode !== ''){
                            Api.get('product', productCode).then(function(productResponse){
                                var product = new ProductModels.Product(productResponse.data);
                                product.addToCart();
                                setTimeout(function(){
                                    Api.get("cart").then(function(resp) {
                                        $('.ml-header-global-cart-count .mz-cartmonitor').html(resp.data.items.length);
                                        me.update('showGlobalCart');
                                    });
                                }, 1000);
                            });
                        }
                    });
                }, 1000);
            }, function() {
                console.log("Got some error at cross sell in Global Cart");
            });

        },
        openLiteRegistration:function() {
            $(".second-tab").show();
            $(".third-tab").hide();
            $('#liteRegistrationModal').modal('show');
        },
        checkoutGuest: function() {
            $(".second-tab").hide();
            $(".third-tab").show();
            $('#liteRegistrationModal').modal('show');
        },
        getItemsCache: function(){
            return this.model.get( 'items' );
        },
        update: function(showGlobalCart) {
            var me = this;
            Api.get("cart").then(function(resp) {
                resp.data.cartItems = resp.data.items.slice(0,globalCartMaxItemCount);
                if(globalCartHidePopover === true && resp.data.cartItems.length === 0){
                    $(me.el).hide();
                }
                me.model.attributes = resp.data;
                me.render();
                if (showGlobalCart) {
                    me.$el.show();
                    // setTimeout(function() {
                    //     me.$el.attr('style', '');
                    // }, 5000);
                }
                if (globalCartRelatedProducts) {
                    me.showRelatedProducts(resp.data.items);
                }
                if(resp.data.cartItems.length === 0) {
                    $('.ml-header-global-cart-count').addClass('emptyCart');
                } else {
                    $('.ml-header-global-cart-count').removeClass('emptyCart');
                }
            });
        }
    });

    var Model = Backbone.MozuModel.extend();
    var globalCartView = new GlobalCartView({
        el: $('#global-cart'),
        model: new Model({})
    });
    globalCartView.render();
    var GlobalCart = {
        update: function(showGlobalCart) {
            globalCartView.update(showGlobalCart);
        },
        getItemsCache: function(){
            return globalCartView.getItemsCache();
        }
    };
    return GlobalCart;

});
