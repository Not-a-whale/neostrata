/**
 * Watches for changes to the quantity of items in the shopping cart, to update
 * cart count indicators on the storefront.
 */
define(['modules/jquery-mozu', 'modules/api', 'bootstrap', 'modules/page-header/global-cart', 'hyprlive'], function ($, api, Bootstrap, GlobalCart, Hypr) {

    var $cartCount,
        user = require.mozuData('user'),
        userId = user.userId,
        cartTotal = 0,
        $document = $(document),
        CartMonitor = {
            setAmount: function(amount) {
                var localAmount = Hypr.engine.render("{{price|currency}}",{ locals: { price: amount }});
                this.$amountEl.text(localAmount);
                cartTotal = amount;
            },
            setCount: function(count) {
                this.$el.text(count);
                if(savedCart.totalQuantity === 0) {
                    $('.ml-header-global-cart-count').addClass('emptyCart');
                } else {
                    $('.ml-header-global-cart-count').removeClass('emptyCart');
                }
            },
            addToCount: function( count, offerSampleProducts ) {
                this.update(true, offerSampleProducts);
            },
            getCount: function() {
                return parseInt(this.$el.text(), 10) || 0;
            },
            getCartTotal: function() {
                return cartTotal;
            },
            getItemsCache: function() {
                return GlobalCart.getItemsCache();
            },
            update: function( showGlobalCart, offerSampleProducts ) {
                api.get('cartsummary').then(function(summary) {
                    $.cookie('mozucart', JSON.stringify(summary.data), { path: '/' });
                    savedCarts[userId] = summary.data;
                    //console.log(summary);

                    if( offerSampleProducts ){
                        $document.ready(function() {
                            CartMonitor.setCount(summary.data.totalQuantity);
                            CartMonitor.setAmount(summary.data.total);
                        });
                    }
                    else{
                        $document.ready(function() {
                            $('.ml-header-global-cart-wrapper').css('display', 'block');
                            CartMonitor.setCount(summary.data.totalQuantity);
                            CartMonitor.setAmount(summary.data.total);
                            GlobalCart.update( showGlobalCart );
                        });
                    }
                });

            }
        },
        savedCarts,
        savedCart;

    try {
        savedCarts = JSON.parse($.cookie('mozucart'));
    } catch(e) {}

    if (!savedCarts) savedCarts = {};
    savedCart = savedCarts || savedCarts[userId];

    //if (isNaN(savedCart.itemCount)) {
        CartMonitor.update();
    //}

    $document.ready(function () {
        if(savedCart.totalQuantity === 0) {
            $('.ml-header-global-cart-count').addClass('emptyCart');
        } else {
            $('.ml-header-global-cart-count').removeClass('emptyCart');
        }
        CartMonitor.$el = $('[data-mz-role="cartcount"]').text(savedCart.totalQuantity || 0);
        CartMonitor.$amountEl = $('[data-mz-role="cartamount"]').text(savedCart.total || 0);
    });

    return CartMonitor;

});
