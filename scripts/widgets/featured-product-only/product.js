define(['modules/jquery-mozu', "modules/api", 'modules/models-product', 'underscore', "modules/cart-monitor"],
    function ($, api, ProductModels, _, CartMonitor) { 
        function showAddToWishListM(){
            if($('#addToWishListPopUp').length === 1){
                $('#addToWishListPopUp').remove();
            }
            $( '<div id="addToWishListPopUp" class="row alert" role="alert"><div class="col-xs-6 text-right">Item added to wishlist.</div><div class="col-xs-6 text-left"><a href="/myaccount#wishlist">View Wishlist</a></div></div>' ).insertAfter('#nav-header-container > #ml-nav');
            setTimeout(function(){ 
                $('#addToWishListPopUp').fadeOut(function(){$(this).remove();});
            }, 5000);
        }
        function showRemoveFromWishListM(){
            if($('#addToWishListPopUp').length === 1){
                $('#addToWishListPopUp').remove();
            }
            $( '<div id="addToWishListPopUp" class="row alert" role="alert"><div class="col-xs-6 text-right">Item removed from wishlist.</div><div class="col-xs-6 text-left"><a href="/myaccount#wishlist">View Wishlist</a></div></div>' ).insertAfter('#nav-header-container > #ml-nav');
            setTimeout(function(){ 
                $('#addToWishListPopUp').fadeOut(function(){$(this).remove();});
            }, 5000);
        }
        $(document).ready(function() {
            var user = require.mozuData('user');
            if(user.accountId){
                if(localStorage.getItem('addToWishlist')){
                    var savedProdToWish = JSON.parse(localStorage.getItem('addToWishlist'));
                    localStorage.removeItem('addToWishlist');
                    api.get('product', savedProdToWish.code).then(function(productResponse){
                        var product = new ProductModels.Product(productResponse.data);
                        product.addToWishlist();
                        setTimeout(function(){
                            api.createSync('wishlist').getOrCreate(user.accountId).then(function(wishlist) {
                                return wishlist.data;
                            }).then(function(wishlistItems) {          
                                $( ".featured-product-only-widget .mz-productdetail-addToWishlist-Action" ).data('mz-wishlist-id', wishlistItems.id);
                                for (var i = 0; i < wishlistItems.items.length; i++) {
                                    if(wishlistItems.items[i].product.productCode === $('.featured-product-only-widget .mz-productdetail-addToWishlist-Action').data('mzProductCode')){
                                        $( ".featured-product-only-widget .mz-productdetail-addToWishlist-Action" ).data('mz-item-id', wishlistItems.items[i].id);
                                    }
                                    $('[data-mz-product-code="'+wishlistItems.items[i].product.productCode+'"] span').removeClass("heart-outline").addClass("heart-filled");
                                }
                            });
                        }, 1000);
                    });                
                }else{
                    api.createSync('wishlist').getOrCreate(user.accountId).then(function(wishlist) {
                        return wishlist.data;
                    }).then(function(wishlistItems) {        
                        $( ".featured-product-only-widget .mz-productdetail-addToWishlist-Action" ).data('mz-wishlist-id', wishlistItems.id);
                        for (var i = 0; i < wishlistItems.items.length; i++) {
                            if(wishlistItems.items[i].product.productCode === $('.featured-product-only-widget .mz-productdetail-addToWishlist-Action').data('mzProductCode')){
                                $( ".featured-product-only-widget .mz-productdetail-addToWishlist-Action" ).data('mz-item-id', wishlistItems.items[i].id);
                            }
                            $('[data-mz-product-code="'+wishlistItems.items[i].product.productCode+'"] span').removeClass("heart-outline").addClass("heart-filled");
                        }
                    });
                }
            }
            $('.featured-product-only-widget .mz-productdetail-addToWishlist-Action').click(function() {
                var qvProductCode = $('.featured-product-only-widget .mz-productdetail-addToWishlist-Action').data('mzProductCode');
                if(user.accountId){
                    if($('.featured-product-only-widget .mz-productdetail-addToWishlist-Action span').hasClass('heart-outline')){
                        api.createSync('wishlist').getOrCreate(user.accountId).then(function(wishlist) {
                            return wishlist.data;
                        }).then(function(wishlistItems) {
                            var proceed = true;
                            for (var i = 0; i < wishlistItems.items.length; i++) {
                                if (wishlistItems.items[i].product.productCode == qvProductCode) {
                                    proceed = false;
                                }
                            }
                
                            if (proceed) {
                                var product = new ProductModels.Product({ productCode: qvProductCode} );
                                product.addToWishlist({ quantity: 1});
                
                                try {
                                    product.on('addedtowishlist', function(wishlistitem) {
                                        $( ".featured-product-only-widget .mz-productdetail-addToWishlist-Action" ).data('mz-item-id', wishlistitem.data.id);
                                        $('.featured-product-only-widget .mz-productdetail-addToWishlist-Action span').removeClass("heart-outline").addClass("heart-filled");
                                        showAddToWishListM();
                                    });
                                } catch (err) {
                                    console.log("Error Obj:" + err);
                                }
                            }
                        });
                    }
                    else{
                        var finishRemoveItem_id = $( ".featured-product-only-widget .mz-productdetail-addToWishlist-Action" ).data('mz-item-id');
                        var wishlistId = $( ".featured-product-only-widget .mz-productdetail-addToWishlist-Action" ).data('mz-wishlist-id');
                        var serviceurl = '/api/commerce/wishlists/'+ wishlistId +'/items/' + finishRemoveItem_id;
                        api.request('DELETE', serviceurl).then(function(res) {
                            $('.featured-product-only-widget .mz-productdetail-addToWishlist-Action span').removeClass("heart-filled").addClass("heart-outline");
                            showRemoveFromWishListM();
                            $( ".featured-product-only-widget .mz-productdetail-addToWishlist-Action" ).removeData('mz-item-id');
                        });
                    }
                }else{
                    localStorage.setItem('addToWishlist', JSON.stringify({ 'code': qvProductCode }));
                    $('.login-link-text').trigger( "click" );
                }
            });
            $('.featured-product-only-widget  #add-to-cart').click(function(){
                var productCode = $('.featured-product-only-widget .mz-productdetail-addToWishlist-Action').data('mzProductCode');
                var qty = $('.featured-product-only-widget #mz_pdp_qty').val();
                if(productCode && productCode !== ''){
                    api.get('product', productCode).then(function(productResponse){
                        var product = new ProductModels.Product(productResponse.data);
                        console.log(product);
                        // product.addToCart({ quantity: parseInt(qty)});
                        // setTimeout(function(){
                        //     CartMonitor.update('showGlobalCart');
                        // }, 1000);
                    });
                }
            });
        });
    });