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
    });
});
