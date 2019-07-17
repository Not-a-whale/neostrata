require([
    "modules/jquery-mozu",
    "modules/api"
], function($, api) {    
    if (require.mozuData('pagecontext').isEditMode) {
        $('.wishlist-item-count-wrapper').show();             
    }else{
        var quizCompleted = false;
        var quizInfo = {};
        if($.cookie('quiz-info')){
            quizInfo = JSON.parse($.cookie('quiz-info'));    
            if (quizInfo['quiz-recommended-regimen']) quizCompleted = true;
        }

        var user = require.mozuData('user');
        if(!quizCompleted && user.isAuthenticated && user.accountId){
            var apiData = require.mozuData('apicontext');                            
            $.ajax({
                url: '/api/commerce/customer/accounts/'+user.accountId+'/attributes',
                headers: apiData.headers,
                method: 'GET',
                success: function(data) {
                    if(data.totalCount){
                        var customerAttributes = data.items;
                        customerAttributes.forEach(function(attribute) {
                            var quizValue = attribute.values[0];
                            if(attribute.fullyQualifiedName == 'tenant~quiz-recommended-regimen') quizInfo['quiz-recommended-regimen'] = quizValue;
                            if(attribute.fullyQualifiedName == 'tenant~quiz-recommended-product') quizInfo['quiz-recommended-product'] = quizValue;
                            if(attribute.fullyQualifiedName == 'tenant~quiz-skincare-knowledge') quizInfo['quiz-skincare-knowledge'] = quizValue;
                            if(attribute.fullyQualifiedName == 'tenant~quiz-primary-skin-concern') quizInfo['quiz-primary-skin-concern'] = quizValue;
                            if(attribute.fullyQualifiedName == 'tenant~quiz-skin-type') quizInfo['quiz-skin-type'] = quizValue;
                            if(attribute.fullyQualifiedName == 'tenant~quiz-products-currently-used') quizInfo['quiz-products-currently-used'] = quizValue;
                            if(attribute.fullyQualifiedName == 'tenant~quiz-routine-product-number') quizInfo['quiz-routine-product-number'] = quizValue;
                            if(attribute.fullyQualifiedName == 'tenant~quiz-gender') quizInfo['quiz-gender'] = quizValue;
                            if(attribute.fullyQualifiedName == 'tenant~quiz-age') quizInfo['quiz-age'] = quizValue;
                        });
                        if(quizInfo) {
                            $.cookie('quiz-info', JSON.stringify(quizInfo));
                            if (quizInfo['quiz-recommended-regimen']) quizCompleted = true;
                        }
                    }
                }
            }); 
        }

        $(document).ready(function(){
          if(user.accountId){
              api.createSync('wishlist').getOrCreate(user.accountId).then(function(wishlist) {
                  return wishlist.data;
              }).then(function(wishlistItems) {
                  if(quizCompleted && wishlistItems.items.length) $('.wishlist-item-count-wrapper').show();
                  $('.wishlist-item-count-wrapper .wishNumber').html(wishlistItems.items.length);
              });
          } else {
            if(sessionStorage.getItem('addToWishlistArr')){
                var savedProdToWish = JSON.parse(sessionStorage.getItem('addToWishlistArr'));
                if(savedProdToWish.length) $('.wishlist-item-count-wrapper').show();
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
                            if(quizCompleted && wishlistItems.items.length){
                                $('.wishlist-item-count-wrapper').show();
                            }else{
                                $('.wishlist-item-count-wrapper').hide();
                            }
                            $('.wishNumber').html(wishlistItems.items.length);
                        });
                    }, 800);
                }else{                    
                    setTimeout(function(){ //must wait session storage manipulation
                        var savedProdToWish = [];
                        if(sessionStorage.getItem('addToWishlistArr')) savedProdToWish = JSON.parse(sessionStorage.getItem('addToWishlistArr'));
                        if(quizCompleted && savedProdToWish.length){
                            $('.wishlist-item-count-wrapper').show();
                        }else{
                            $('.wishlist-item-count-wrapper').hide();
                        }
                        $('.wishNumber').html(savedProdToWish.length);
                    }, 200);
                }
            });
        });           
    }
});
