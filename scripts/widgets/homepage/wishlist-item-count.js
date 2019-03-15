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
              $('.wishlist-item-count > .heart > .count-number > .wishNumber').html(wishlistItems.items.length);
          });
      }
    });
});
