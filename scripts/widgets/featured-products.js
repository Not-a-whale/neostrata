define(['modules/jquery-mozu', "modules/api", 'modules/models-product', 'underscore', "modules/cart-monitor"],
    function ($, api, ProductModels, _, CartMonitor) {
        function showAddToWishListM(){
            if($('#addToWishListPopUp').length === 1){
                $('#addToWishListPopUp').remove();
            }
            $( '<div id="addToWishListPopUp" class="row alert" role="alert"><div class="col-xs-6 text-right">Item added to wishlist.</div><div class="col-xs-6 text-left"><a href="/myaccount?sec=wishlist">View Wishlist</a></div></div>' ).insertAfter('#nav-header-container > #ml-nav');
            setTimeout(function(){
                $('#addToWishListPopUp').fadeOut(function(){$(this).remove();});
            }, 5000);
        }
        function showRemoveFromWishListM(){
            if($('#addToWishListPopUp').length === 1){
                $('#addToWishListPopUp').remove();
            }
            $( '<div id="addToWishListPopUp" class="row alert" role="alert"><div class="col-xs-6 text-right">Item removed from wishlist.</div><div class="col-xs-6 text-left"><a href="/myaccount?sec=wishlist">View Wishlist</a></div></div>' ).insertAfter('#nav-header-container > #ml-nav');
            setTimeout(function(){
                $('#addToWishListPopUp').fadeOut(function(){$(this).remove();});
            }, 5000);
        }
        $(document).ready(function() {
            var productRegimenCollection = [];
            var totalPrice = 0;
            var count = 0;
            var cat = $('[data-role="regimen-products"]').data('mzCategoryRegimen');
            var user = require.mozuData('user');
            if(user.accountId){
                if(localStorage.getItem('addToWishlist')) {
                    var savedProdToWish = JSON.parse(localStorage.getItem('addToWishlist'));
                    localStorage.removeItem('addToWishlist');
                    api.get('product', savedProdToWish.code).then(function(productResponse){
                        var product = new ProductModels.Product(productResponse.data);
                        product.addToWishlist();
                        setTimeout(function(){
                            api.createSync('wishlist').getOrCreate(user.accountId).then(function(wishlist) {
                                return wishlist.data;
                            }).then(function(wishlistItems) {
                                $('.featured-product-container .mz-productdetail-addtowishlist').data('mz-wishlist-id', wishlistItems.id);
                                for (var i = 0; i < wishlistItems.items.length; i++) {
                                    if(wishlistItems.items[i].product.productCode === $('.featured-product-container #add-to-cart-featuredBlock').data('mzProductCode')){
                                        $('.featured-product-container .mz-productdetail-addtowishlist').data('mz-item-id', wishlistItems.items[i].id);
                                    }
                                    $('[data-mz-product-code="'+wishlistItems.items[i].product.productCode+'"] span').removeClass("heart-outline").addClass("heart-filled");
                                }
                            });
                        }, 1000);
                    });
                } else {
                    api.createSync('wishlist').getOrCreate(user.accountId).then(function(wishlist) {
                        return wishlist.data;
                    }).then(function(wishlistItems) {
                        $('[data-widget="featured-regimen-display"] .mz-productdetail-addtowishlist').data('mz-wishlist-id', wishlistItems.id);
                        for (var i = 0; i < wishlistItems.items.length; i++) {
                            if(wishlistItems.items[i].product.productCode === $('[data-widget="featured-regimen-display"] #add-to-cart-featuredBlock').data('mzProductCode')){
                                $('[data-widget="featured-regimen-display"] .mz-productdetail-addtowishlist').data('mz-item-id', wishlistItems.items[i].id);
                            }
                            $('[data-mz-product-code="'+wishlistItems.items[i].product.productCode+'"] span').removeClass("heart-outline").addClass("heart-filled");
                        }
                    });
                }
            }
            $('.featured-product-container .mz-productdetail-addtowishlist').click(function() {
                var qvProductCode = $('.featured-product-container #add-to-cart-featuredBlock').data('mzProductCode');
                if(user.accountId){
                    if($('.featured-product-container .mz-productdetail-addtowishlist span').hasClass('blank-heart')){
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
                                        $('.featured-product-container .mz-productdetail-addtowishlist').data('mz-item-id', wishlistitem.data.id);
                                        $('.featured-product-container .mz-productdetail-addtowishlist span').removeClass("blank-heart").addClass("filled-heart");
                                        showAddToWishListM();
                                    });
                                } catch (err) {
                                    console.log("Error Obj:" + err);
                                }
                            }
                        });
                    }
                    else{
                        var finishRemoveItem_id = $('.featured-product-container .mz-productdetail-addtowishlist').data('mz-item-id');
                        var wishlistId = $('.featured-product-container .mz-productdetail-addtowishlist').data('mz-wishlist-id');
                        var serviceurl = '/api/commerce/wishlists/'+ wishlistId +'/items/' + finishRemoveItem_id;
                        api.request('DELETE', serviceurl).then(function(res) {
                            $('.featured-product-container .mz-productdetail-addtowishlist span').removeClass("filled-heart").addClass("blank-heart");
                            showRemoveFromWishListM();
                            $('.featured-product-container .mz-productdetail-addtowishlist').removeData('mz-item-id');
                        });
                    }
                }else{
                    localStorage.setItem('addToWishlist', JSON.stringify({ 'code': qvProductCode }));
                    $('[data-mz-action="lite-registration"]').trigger( "click" );
                }
            });
            if(cat){
                api.get("search", { filter: "categoryId eq " + cat }).then(function(productResponse){
                    count = productResponse.length;
                    for(var i=0; productResponse.length; i++){
                        productRegimenCollection.push(productResponse[i].data.productCode);
                        totalPrice = totalPrice + productResponse[i].data.price.price;
                    }
                });
                setTimeout(function() {
                    $('[data-control="add-to-cart-regimen"]').data('mzProductCode', JSON.stringify(productRegimenCollection));
                    $('.countProd').html( count + ' PRODUCTS - $' + totalPrice.toFixed(2));
                }, 1000);
            }
            $('[data-control="add-to-cart"]').click(function(){
                var productCode = $(this).data('mzProductCode');
                if(productCode && productCode !== ''){
                    api.get('product', productCode).then(function(productResponse){
                        var product = new ProductModels.Product(productResponse.data);
                        product.addToCart();
                        setTimeout(function(){
                            CartMonitor.update('showGlobalCart');
                        }, 1000);
                    });
                }
            });
            $('[data-control="add-to-cart-regimen"]').click(function(){
                var pCodes = $(this).data('mzProductCode');
                var i = 0;
                $('[data-control="add-to-cart-regimen"]').addClass('loadAddToCartProd');
                _.each(JSON.parse(pCodes), function(code, index, list) {
                    setTimeout(function(){
                        if(code && code !== ''){
                            api.get('product', code).then(function(productResponse){
                                var product = new ProductModels.Product(productResponse.data);
                                product.addToCart();
                                if(index + 1 == list.length) {
                                    $('[data-control="add-to-cart-regimen"]').removeClass('loadAddToCartProd');
                                    setTimeout(function(){
                                        CartMonitor.update('showGlobalCart');
                                    }, 1000);
                                }
                            });
                        }
                    }, i);
                    i = i + 800;
                });
            });
        });
    });
