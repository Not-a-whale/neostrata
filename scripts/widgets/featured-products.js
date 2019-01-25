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
            var productRegimenCollection = [];
            var totalPrice = 0;
            var count = 0;
            var cat = $('.regimenProducts').data('mzCategoryRegimen');
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
                                $( "#product-list-featuredBlock .mz-productdetail-addtowishlist" ).data('mz-wishlist-id', wishlistItems.id);
                                for (var i = 0; i < wishlistItems.items.length; i++) {
                                    if(wishlistItems.items[i].product.productCode === $('#product-list-featuredBlock #add-to-cart-featuredBlock').data('mzProductCode')){
                                        $( "#product-list-featuredBlock .mz-productdetail-addtowishlist" ).data('mz-item-id', wishlistItems.items[i].id);
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
                        $( "#product-list-featuredBlock .mz-productdetail-addtowishlist" ).data('mz-wishlist-id', wishlistItems.id);
                        for (var i = 0; i < wishlistItems.items.length; i++) {
                            if(wishlistItems.items[i].product.productCode === $('#product-list-featuredBlock #add-to-cart-featuredBlock').data('mzProductCode')){
                                $( "#product-list-featuredBlock .mz-productdetail-addtowishlist" ).data('mz-item-id', wishlistItems.items[i].id);
                            }
                            $('[data-mz-product-code="'+wishlistItems.items[i].product.productCode+'"] span').removeClass("heart-outline").addClass("heart-filled");
                        }
                    });
                }
            }
            $('#product-list-featuredBlock .mz-productdetail-addtowishlist').click(function() {
                var qvProductCode = $('#product-list-featuredBlock #add-to-cart-featuredBlock').data('mzProductCode');
                if(user.accountId){
                    if($('#product-list-featuredBlock .mz-productdetail-addtowishlist span').hasClass('blank-heart')){
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
                                        $( "#product-list-featuredBlock .mz-productdetail-addtowishlist" ).data('mz-item-id', wishlistitem.data.id);
                                        $('#product-list-featuredBlock .mz-productdetail-addtowishlist span').removeClass("blank-heart").addClass("filled-heart");
                                        showAddToWishListM();
                                    });
                                } catch (err) {
                                    console.log("Error Obj:" + err);
                                }
                            }
                        });
                    }
                    else{
                        var finishRemoveItem_id = $( "#product-list-featuredBlock .mz-productdetail-addtowishlist" ).data('mz-item-id');
                        var wishlistId = $( "#product-list-featuredBlock .mz-productdetail-addtowishlist" ).data('mz-wishlist-id');
                        var serviceurl = '/api/commerce/wishlists/'+ wishlistId +'/items/' + finishRemoveItem_id;
                        api.request('DELETE', serviceurl).then(function(res) {
                            $('#product-list-featuredBlock .mz-productdetail-addtowishlist span').removeClass("filled-heart").addClass("blank-heart");
                            showRemoveFromWishListM();
                            $( "#product-list-featuredBlock .mz-productdetail-addtowishlist" ).removeData('mz-item-id');
                        });
                    }
                }else{
                    localStorage.setItem('addToWishlist', JSON.stringify({ 'code': qvProductCode }));
                    $('.login-link-text').trigger( "click" );
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
                    $('#add-to-cart-regimen').data('mzProductCode', JSON.stringify(productRegimenCollection));
                    $('.countProd').html( count + ' PRODUCTS - $' + totalPrice.toFixed(2));
                }, 1000);
            }
            $('#add-to-cart-featuredBlock').click(function(){
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
            $('#add-to-cart-regimen').click(function(){
                var pCodes = $(this).data('mzProductCode');
                var i = 0;
                $('#add-to-cart-regimen').addClass('loadAddToCartProd');
                _.each(JSON.parse(pCodes), function(code, index, list) {
                    setTimeout(function(){
                        if(code && code !== ''){
                            api.get('product', code).then(function(productResponse){
                                var product = new ProductModels.Product(productResponse.data);
                                product.addToCart();
                                if(index + 1 == list.length) {
                                    $('#add-to-cart-regimen').removeClass('loadAddToCartProd');
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