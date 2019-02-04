define(['shim!vendor/typeahead.js/typeahead.bundle[modules/jquery-mozu=jQuery]>jQuery', 'swiper', "modules/api", "modules/models-product", "modules/cart-monitor"], function($, Swiper, api, ProductModels, CartMonitor) {
    var swiper = new Swiper('.swiper-container-4', {
        slidesPerView: 4,
        spaceBetween: 0,
        loop: true,
		navigation: {
			nextEl: '.swiper-button-next',
			prevEl: '.swiper-button-prev'
        },
        preventClicks: false,
        preventClicksPropagation: false,
        breakpoints: {
            1024: {
                slidesPerView: 4
            },
            992: {
                slidesPerView: 2
            },
            768: {
                slidesPerView: '1'
            },
            640: {
                slidesPerView: '1'
            },
            320: {
                slidesPerView: '1'
            }
        }
    });
    $(document).ready(function() {
        var user = require.mozuData('user');
        setTimeout(function(){
            api.createSync('wishlist').getOrCreate(user.accountId).then(function(wishlist) {
                return wishlist.data;
            }).then(function(wishlistItems) {
                for (var i = 0; i < wishlistItems.items.length; i++) {
                    if($('[data-mz-product-code="'+wishlistItems.items[i].product.productCode+'"]')){
                        $('[data-mz-product-code="'+wishlistItems.items[i].product.productCode+'"]').data('mz-item-id', wishlistItems.items[i].id);
                        $('[data-mz-product-code="'+wishlistItems.items[i].product.productCode+'"]').data('mz-wishlist-id', wishlistItems.id);
                        $('[data-mz-product-code="'+wishlistItems.items[i].product.productCode+'"]').data('mz-action', "directoryRemoveFromWishlist");
                        $('[data-mz-product-code="'+wishlistItems.items[i].product.productCode+'"] span').removeClass("blank-heart").addClass("filled-heart");
                    }
                }
            });
            $('.swiper-container-4 .mz-productdetail-addtocart').click(function(){
                var productCode = $(this).data('mzProductCode');
                if(productCode && productCode !== ''){
                    api.get('product', productCode).then(function(productResponse){
                        var product = new ProductModels.Product(productResponse.data);
                        product.addToCart();
                        setTimeout(function(){
                            CartMonitor.update('showGlobalCart');
                            $('html, body').animate({ scrollTop: 0 }, 'normal');
                        }, 1000);
                    });
                }
            });
            $('.swiper-container-4 .').click(function(){
                var productCode = $(this).data('mzProductCode');
                var _e = this;
                if(productCode && productCode !== ''){
                    if(user.accountId){
                        var action = $(_e).data("mz-action");
                        if(action == 'directoryAddToWishlist'){
                            api.get('product', productCode).then(function(productResponse){
                                var product = new ProductModels.Product(productResponse.data);
                                product.addToWishlist();
                                setTimeout(function(){
                                    api.createSync('wishlist').getOrCreate(user.accountId).then(function(wishlist) {
                                        return wishlist.data;
                                    }).then(function(wishlistItems) {
                                        for (var i = 0; i < wishlistItems.items.length; i++) {
                                            if(wishlistItems.items[i].product.productCode === productCode){
                                                $(_e).data('mz-item-id', wishlistItems.items[i].id);
                                            }
                                        }
                                        $(_e).data('mz-wishlist-id', wishlistItems.id);
                                        $(_e).data("mz-action", "directoryRemoveFromWishlist");
                                        if($('#addToWishListPopUp').length === 1){
                                            $('#addToWishListPopUp').remove();
                                        }
                                        $( '<div id="addToWishListPopUp" class="row alert" role="alert"><div class="col-xs-6 text-right">Item added to wishlist.</div><div class="col-xs-6 text-left"><a href="/myaccount#wishlist">View Wishlist</a></div></div>' ).insertAfter('#nav-header-container > #ml-nav');
                                        setTimeout(function(){
                                            $('#addToWishListPopUp').fadeOut(function(){$(this).remove();});
                                        }, 5000);
                                        return $('#wishlist-'+productCode+' span').removeClass("blank-heart").addClass("filled-heart");
                                    });
                                }, 1000);
                               
                            });
                        }else if(action == 'directoryRemoveFromWishlist'){
                            var finishRemoveItemId = $(_e).data('mz-item-id');
                            var wishlistId = $(_e).data('mz-wishlist-id');
                            var serviceurl = '/api/commerce/wishlists/'+ wishlistId +'/items/' + finishRemoveItemId;
                            api.request('DELETE', serviceurl).then(function(res) {
                                $(_e).data("mz-action", "directoryAddToWishlist");
                                if($('#addToWishListPopUp').length === 1){
                                    $('#addToWishListPopUp').remove();
                                }
                                $( '<div id="addToWishListPopUp" class="row alert" role="alert"><div class="col-xs-6 text-right">Item removed from wishlist.</div><div class="col-xs-6 text-left"><a href="/myaccount#wishlist">View Wishlist</a></div></div>' ).insertAfter('#nav-header-container > #ml-nav');
                                setTimeout(function(){
                                    $('#addToWishListPopUp').fadeOut(function(){$(this).remove();});
                                }, 5000);
                                return $('#wishlist-'+productCode+' span').removeClass("filled-heart").addClass("blank-heart");
                            });
                        }
                    }else{
                        sessionStorage.setItem('addToWishlist', productCode);
                        $(".login-link-text").trigger("click");
                    }
                }
            });
        }, 1000);
    });
});