require([
    "modules/jquery-mozu",
    "modules/api"
], function($, api) {
    var user = require.mozuData('user');
    $(document).ready(function(){
      if(user.accountId){
          api.createSync('wishlist').getOrCreate(user.accountId).then(function(wishlist) {
              return wishlist.data;
          }).then(function(wishlistItems) {
              $('.wishlist-item-count-wrapper .wishNumber').html(wishlistItems.items.length);
          });
      } else {
        if(sessionStorage.getItem('addToWishlistArr')){
            var savedProdToWish = JSON.parse(sessionStorage.getItem('addToWishlistArr'));
            $('.wishlist-item-count-wrapper .wishNumber').html(savedProdToWish.length);
        }
      }
        $('.mz-productdetail-addtowishlist, .mz-productdetail-addToWishlist-Action').click(function(){
            var user = require.mozuData('user');
            if(user.accountId){
                setTimeout(function(){ //must wait for api actions
                    api.createSync('wishlist').getOrCreate(user.accountId).then(function(wishlist) {
                        return wishlist.data;
                    }).then(function(wishlistItems) {
                        $('.wishNumber').html(wishlistItems.items.length);
                    });
                }, 800);
            }else{                    
                setTimeout(function(){ //must wait session storage manipulation
                    var savedProdToWish = [];
                    if(sessionStorage.getItem('addToWishlistArr')) savedProdToWish = JSON.parse(sessionStorage.getItem('addToWishlistArr'));
                    $('.wishNumber').html(savedProdToWish.length);
                }, 200);
            }
        });
    });
});
