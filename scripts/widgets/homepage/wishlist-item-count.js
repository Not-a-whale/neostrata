require(["modules/jquery-mozu",
        'underscore',
        'modules/backbone-mozu',
        "hyprlive",
        "modules/api", 
        'modules/models-product', 
        "modules/cart-monitor",
        'modules/block-ui'], 
        function($, _, Backbone, Hypr, api, ProductModels, CartMonitor, blockUiLoader) {    

    var user = require.mozuData('user');
    
    var wishlistBoxView = Backbone.View.extend({
        
        template: _.template($('#wishlist-box-wrapper').html()),
        el: $('[data-section="wishlist-box-wrapper"]'),
        quizCompleted: false,
        productRegimenCollection: [],
        quizInfo: {},
        wishlistItemsCount: 0,
        
        resetQuizInfo: function(){
            
            this.quizInfo = false;
            var cookieInfo = {};            
            if($.cookie('quiz-info')){
                cookieInfo = JSON.parse($.cookie('quiz-info'));
            }else if(user.isAuthenticated && user.accountId){ //check if user already completed the quiz
                var apiData = require.mozuData('apicontext');              
                $.ajax({
                    url: '/api/commerce/customer/accounts/'+user.accountId+'/attributes',
                    headers: apiData.headers,
                    method: 'GET',
                    success: function(data) {
                        if(data.totalCount){
                            data.items.forEach(function(attribute) {
                                var quizValue = attribute.values[0];
                                if(attribute.fullyQualifiedName == 'tenant~quiz-recommended-regimen') cookieInfo['quiz-recommended-regimen'] = quizValue;
                                if(attribute.fullyQualifiedName == 'tenant~quiz-recommended-product') cookieInfo['quiz-recommended-product'] = quizValue;
                                if(attribute.fullyQualifiedName == 'tenant~quiz-skincare-knowledge') cookieInfo['quiz-skincare-knowledge'] = quizValue;
                                if(attribute.fullyQualifiedName == 'tenant~quiz-primary-skin-concern') cookieInfo['quiz-primary-skin-concern'] = quizValue;
                                if(attribute.fullyQualifiedName == 'tenant~quiz-skin-type') cookieInfo['quiz-skin-type'] = quizValue;
                                if(attribute.fullyQualifiedName == 'tenant~quiz-products-currently-used') cookieInfo['quiz-products-currently-used'] = quizValue;
                                if(attribute.fullyQualifiedName == 'tenant~quiz-routine-product-number') cookieInfo['quiz-routine-product-number'] = quizValue;
                                if(attribute.fullyQualifiedName == 'tenant~quiz-gender') cookieInfo['quiz-gender'] = quizValue;
                                if(attribute.fullyQualifiedName == 'tenant~quiz-age') cookieInfo['quiz-age'] = quizValue;
                            });
                            if(cookieInfo)  $.cookie('quiz-info', JSON.stringify(cookieInfo));
                        }
                    }
                });     
            }
            if($.isEmptyObject(cookieInfo)) return ;
            this.quizInfo = cookieInfo;
            if(this.getQuizInfoData('quiz-recommended-regimen')) this.setQuizCompleted(true);    
        },
        setQuizCompleted: function(state){
            
            this.quizCompleted = state;    
        },
        getQuizCompleted: function(){
            
            return this.quizCompleted;
        },
        getQuizInfoData: function(value){
            
            if(value){
                var quizInfo = this.quizInfo;
                if(value in quizInfo) return quizInfo[value];
            }
            return false;
        },
        setWishlistItemsCount: function(value){
        
            this.wishlistItemsCount = value;
        },
        getWishlistItemsCount: function(){
        
            return this.wishlistItemsCount;
        },
        getLocals: function(){
            
            var config = JSON.parse($('#wishlistbox-config').html()),
                self = this,
                categoryId = '',
                regDesc = '',
                regLink = '',
                regSmallBackground = '',
                regBigBackground = '';
        
            switch (this.getQuizInfoData('quiz-recommended-regimen')) {
                case 'SAR/F':
                    categoryId = config.skinactiveCategoryId;
                    regDesc = config.skinactiveDesc;
                    regLink = config.skinactiveLink;
                    regSmallBackground = "/cms/files/"+config.skinactiveSmallBackground;
                    regBigBackground = "/cms/files/"+config.skinactiveBigBackground;
                    break;
                case 'RESURFACE':
                    categoryId = config.resurfaceCategoryId;
                    regDesc = config.resurfaceDesc;
                    regLink = config.resurfaceLink;
                    regSmallBackground = "/cms/files/"+config.resurfaceSmallBackground;
                    regBigBackground = "/cms/files/"+config.resurfaceBigBackground;
                    break;
                case 'RESTORE':
                    categoryId = config.restoreCategoryId;
                    regDesc = config.restoreDesc;
                    regLink = config.restoreLink;
                    regSmallBackground = "/cms/files/"+config.restoreSmallBackground;
                    regBigBackground = "/cms/files/"+config.restoreBigBackground;
                    break;
                case 'CLARIFY':
                    categoryId = config.clarifyCategoryId;
                    regDesc = config.clarifyDesc;
                    regLink = config.clarifyLink;
                    regSmallBackground = "/cms/files/"+config.clarifySmallBackground;
                    regBigBackground = "/cms/files/"+config.clarifyBigBackground;
                    break;
                case 'ENLIGHTEN':
                    categoryId = config.enlightenCategoryId;
                    regDesc = config.enlightenDesc;
                    regLink = config.enlightenLink;
                    regSmallBackground = "/cms/files/"+config.enlightenSmallBackground;
                    regBigBackground = "/cms/files/"+config.enlightenBigBackground;
                    break;
                case 'CORRECT':
                    categoryId = config.correctCategoryId;
                    regDesc = config.correctDesc;
                    regLink = config.correctLink;
                    regSmallBackground = "/cms/files/"+config.correctSmallBackground;
                    regBigBackground = "/cms/files/"+config.correctBigBackground;
                    break;                                                                           
                default:
                    // do nothing;
                    break;
            }
            
            api.get("search", { filter: "categoryId eq " + categoryId }).then(function(productResponse){               
                return productResponse.data;
            }).then(function(products) {
                var totalPrice = 0;
                products.items.forEach(function(product) {
                    self.productRegimenCollection.push(product.productCode);
                    totalPrice = totalPrice + product.price.price;
                });
                $('#regimen-items-and-price').html(products.totalCount + ' PRODUCTS - ' + Hypr.engine.render("{{price|currency}}",{ locals: { price: totalPrice }}));
            });
            
            var locals = {regimenTitle: config.regimenTitle,
                          regimenName: this.getQuizInfoData('quiz-recommended-regimen').toLowerCase(),
                          regimenDescription: regDesc,
                          regimenButton: config.regimenButton,
                          regimenLink: regLink,
                          regimenSmallBackground: regSmallBackground,
                          regimenBigBackground: regBigBackground,
                          wishlistTitle: config.title,
                          wishlistItems: this.getWishlistItemsCount(),
                          wishlistButtonTitle: config.linkTitle};
            
            return locals;
        },
        initialize: function() {
            
            this.resetQuizInfo();
            if(user.isAuthenticated && user.accountId){
                var self = this;
                api.createSync('wishlist').getOrCreate(user.accountId).then(function(wishlist) {
                    return wishlist.data;
                }).then(function(wishlistItems) {
                    self.setWishlistItemsCount(wishlistItems.items.length);
                    self.render();
                });
            } else {
                if(sessionStorage.getItem('addToWishlistArr')){
                    var savedProdToWish = JSON.parse(sessionStorage.getItem('addToWishlistArr'));
                    this.setWishlistItemsCount(savedProdToWish.length);
                    this.render();
                }
            }
        },
        render: function() {
            
            if(this.getQuizCompleted() && this.getWishlistItemsCount()) this.$el.html(this.template(this.getLocals()));
        },
        events: {
            'click [data-control="add-to-cart-regimen"]': function(evt) {  
                blockUiLoader.globalLoader();
                var pCodes = this.productRegimenCollection;
                var i = 0;
                _.each(pCodes, function(code, index, list) {
                    setTimeout(function(){
                        api.get('product', code).then(function(productResponse){
                            var product = new ProductModels.Product(productResponse.data);
                            product.addToCart();
                            if(index + 1 == list.length) {
                                blockUiLoader.unblockUi();
                                setTimeout(function(){
                                    CartMonitor.update('showGlobalCart');
                                }, 1000);
                            }
                        });
                    }, i);
                    i = i + 800;
                });
            }
        }
    });
    
    var wishlistBox = new wishlistBoxView();
    wishlistBox.render();

    $('.mz-productdetail-addtowishlist, .mz-productdetail-addToWishlist-Action').click(function(){
        setTimeout(function(){ //must wait for api actions and session storage manipulation
            if(user.accountId){        
                api.createSync('wishlist').getOrCreate(user.accountId).then(function(wishlist) {
                    return wishlist.data;
                }).then(function(wishlistItems) {
                    wishlistBox.setWishlistItemsCount(wishlistItems.items.length);
                    wishlistBox.render();
                });
            }else{
                var savedProdToWish = [];
                if(sessionStorage.getItem('addToWishlistArr')) savedProdToWish = JSON.parse(sessionStorage.getItem('addToWishlistArr'));
                wishlistBox.setWishlistItemsCount(savedProdToWish.length);
                wishlistBox.render();
            }
        }, 800);
    });
});
