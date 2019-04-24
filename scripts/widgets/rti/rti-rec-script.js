require([
 'modules/jquery-mozu',
 'hyprlive',
 "hyprlivecontext",
 'underscore',
 'modules/api',
 'modules/backbone-mozu',
 'modules/models-product',
 'widgets/rti/recommended-products',
 'shim!vendor/jquery/owl.carousel.min[modules/jquery-mozu=jQuery]>jQuery'
],
function($, Hypr, HyprLiveContext, _, api,Backbone, ProductModels, RecommendedProducts) {

// rtiOptions will contain variables used by the
//whole page. They can be set in every widget editor, but only the first
//one on the page is the one that we'll listen to for these variables.

var firstDisplay = $('.recommended-product-container').first();
var firstConfig = firstDisplay.data('mzRtiRecommendedProducts');

var rtiOptions = {
  customerId: firstConfig.customerId || "",
  customerCode: firstConfig.customerCode || "",
  pageType: firstConfig.pageType || "",
  jsInject: firstConfig.javascriptInjection || "",
  includeSiteId: firstConfig.includeSiteId || false,
  includeTenantId: firstConfig.includeTenantId || false
};

var pageContext = require.mozuData('pagecontext');
var siteContext = require.mozuData('sitecontext');

/*
containerList holds data about all of the widgets we're going to make.
*/
var containerList = [];

/*
The following loop acts as cleanup; it populates containerList with the needed data,
ignoring and delegitimizing any divs on the page with duplicate placeholder names.
*/
$('.recommended-product-container').each(function(){
 if (!$(this).hasClass('ignore')){
   var configData = $(this).data('mzRtiRecommendedProducts');
   //displayOptions are individual to each container.
   var displayOptions = {
     title: configData.title || "",
     quantity: configData.numberOfItems || "",
     format: configData.displayType || "",
     placeholder: configData.placeholder || ""
   };
   var container = {config: displayOptions};
   var selector = '.recommended-product-container.'+configData.placeholder;

   if($(selector).length>1){
     $(selector).each(function(index, element){
       if (index>0){
         /*
         We don't want to add the data from accidental duplicates to
         our nice, clean containerList. We also don't want those duplicates to
         accidentally render. So for all but the first element with this
         class name, we strip all classes, add 'ignore' so the .each we're in
         right now ignores the duplicates, hides the div, and adds a message
         in edit mode so the user knows what happened.
         */
         $(element).removeClass();
         $(element).addClass('ignore');
         if (pageContext.isEditMode){
             $("<p>Error: duplicate placeholder name.</p>").insertBefore($(element));
         }
         $(element).hide();
       }
     });
   }
   containerList.push(container);
}
});

/*Recommended Product Code Starts*/
 var eFlag = 0;
 var ProductModelColor = Backbone.MozuModel.extend({
     mozuType: 'products'
 });
//***********************
//---VIEW DEFINITIONS---//
//************************

//***Start Grid view defition:
 var GridView = Backbone.MozuView.extend({
   templateName: 'modules/product/product-list-tiled',
   initialize: function(){
    var self = this;

   },
   render: function(placeholder){
     var elSelector = ".rti-recommended-products."+placeholder;
     var self = this;
     Backbone.MozuView.prototype.render.apply(this, arguments);
   }
 });
//End Grid view definition***

//***Start Carousel view def:
 var ProductListView = Backbone.MozuView.extend({
     templateName: 'Widgets/RTI/rti-product-tiles',
     additionalEvents: {
         "click .next": "next",
         "click .previous": "previous",
         "click a.wishlist-button": "addToWishlist",
         "touchstart a.wishlist-button": "addToWishlist"
     },
     initialize: function() {
         // this.owl = null;
         var self = this;
         var isUserAnonymous = require.mozuData('user').isAnonymous;

         if (isUserAnonymous === false) {
             self.addedToWishlist();
         }
     },
     render: function(placeholder) {
         var elSelector = ".rti-recommended-products."+placeholder;
         var self = this;
         var owlItems = 1;
             if(pageContext.isDesktop) {
                 owlItems = 4;
             }
             else if(pageContext.isTablet) {
                 owlItems = 3;
             }
             else {
                 owlItems = 2;
             }
             Backbone.MozuView.prototype.render.apply(this, arguments);
             this.colorSwatchingRecommend();

             //this.priceFunction();
             var catTitle = '';
             $('[data-toolstip="toolstip"]').tooltip();

               var owl = $(elSelector+" .related-prod-owl-carousel");
               owl.owlCarousel({
                   loop: false,
                   responsiveClass:true,
                   responsive:{
                       0 : {
                           items: 2,
                           nav:false
                       },
                       480 : {
                           items: 3,
                           nav:false
                       },
                       1025 : {
                           items: 4,
                           nav:false
                       }
                   }
               });

               owl.on('changed.owl.carousel', function(e) {
                   if( e.item.index >= 1)
                       $(elSelector).find('.previous').show();
                   else
                       $(elSelector).find('.previous').hide();
                   if( e.item.index === e.item.count-owlItems)
                       $(elSelector).find('.next').hide();
                   else
                       $(elSelector).find('.next').show();
               });

               if(owl.find('.owl-item').length <= owlItems)
                   $(elSelector).find('.next').hide();

               $(elSelector+" .related-prod-owl-carousel > .owl-item").addClass("mz-productlist-item");
               $('.rti-recommended-products.'+placeholder+' .next').on('click', function() {
                   owl.trigger('next.owl.carousel');
               });
               $('.rti-recommended-products.'+placeholder+' .previous').on('click', function() {
                   owl.trigger('prev.owl.carousel');
               });

               var owlItemTotal3 = $(elSelector+" .owl-item").length;
               if(pageContext.isDesktop && owlItemTotal3 >= 5 ) {
                 $(elSelector).css("border-right", "none");
               }
               if(pageContext.isTablet && owlItemTotal3 >= 3) {
                 $(elSelector).css("border-right", "none");
               }
               if(pageContext.isMobile && owlItemTotal3 >= 2 ) {
                 $(elSelector).css("border-right", "none");
               }
               //this.colorSelected();
               this.manageBlocksHeight();


         },
         colorSwatchingRecommend: function(e) {
         $('[data-mz-swatch]').on("click", function(e){
            e.preventDefault();
             if (eFlag === 0) {
                 eFlag = 1;
                 var $currentEvtSource = $(e.currentTarget);
                 //$currentEvtSource.closest('.ig-related-products').find('input').css({'border': 'none'});
                 $currentEvtSource.closest('.owl-item').find('input').css({'border': 'none'});
                 $currentEvtSource.css({'border': '2px solid #4a4a4a'});
                 var productCode = $currentEvtSource.closest('.mz-productlisting').data('mz-product');

                 var swatchCol = $currentEvtSource.attr('value').toLowerCase();
                 var swatchColor = $currentEvtSource.attr('value');

                 var mainImage = $currentEvtSource.closest('.mz-productlisting').find('.mz-subcategory-image').attr("data-main-image-src");

                 var url = window.location.origin;
                 $currentEvtSource.closest('.mz-productlisting').find('.mz-subcategory-image').removeClass('active');
                 $currentEvtSource.closest('.mz-productlisting').find('.mainImageContainer2').addClass('active');
                 var CurrentProductModel = new ProductModelColor();
                 CurrentProductModel.set('filter', 'productCode eq '+productCode);

                 CurrentProductModel.fetch().then(function(responseObject) {
                     var prodContent = responseObject.apiModel.data.items;
                     var prodImg = null, prodImgAltText = null, ImgAltText = null;
                     var flag = 0;

                     _.each(prodContent, function(productImages) {
                         prodImg = _.findWhere(productImages.content.productImages, {altText: swatchColor || swatchCol});
                     });
                     if (prodImg) {
                         var prodImage = prodImg.imageUrl;
                         $currentEvtSource.closest('.mz-productlisting').find('.mz-subcategory-image').attr({"srcset": prodImage+"?max=400", "alt": ImgAltText, "style":""}).addClass('active');
                         $currentEvtSource.closest('.mz-productlisting').find('.mainImageContainer2').removeClass('active');
                         eFlag = 0;
                     } else {
                         $currentEvtSource.closest('.mz-productlisting').find('.mz-subcategory-image').attr({"srcset": mainImage+"?max=400", "style":""}).addClass('active');
                         $currentEvtSource.closest('.mz-productlisting').find('.mainImageContainer2').removeClass('active');
                         eFlag = 0;
                     }
                 });
             }
         });
     },
     addToWishlist: function(e) {
         e.preventDefault();
         var qvProductCode = $(e.currentTarget).data("listing-prod-code");
         var currentWishListBtn = e.currentTarget;

         if($(currentWishListBtn).hasClass('addedToWishlist')) {

         } else {
             $(currentWishListBtn).addClass('clicked');
         }
         var newPromise = api.createSync('wishlist').getOrCreate(require.mozuData('user').accountId).then(function(wishlist) {
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
                         $(currentWishListBtn).attr('disabled', 'disabled');
                         $(currentWishListBtn).addClass("addedToWishlist");
                     });
                 } catch (err) {
                     console.log("Error Obj:" + err);
                 }
             }
         });
     },

     addedToWishlist: function () {

         var productCodesShown = [];
         var productsWishlistBtns = [];
         var productCodesShownIndex = 0;

         $('.owl-item').each(function() {
             var wishlistBtn = $(this).find("a.wishlist-button");
             var listingProductCode = $(wishlistBtn).data("listing-prod-code");
             productCodesShown[productCodesShownIndex] = listingProductCode;
             productsWishlistBtns[productCodesShownIndex] = wishlistBtn;
             productCodesShownIndex++;
         });
         var isUserAnonymous = require.mozuData('user').isAnonymous;
         if (isUserAnonymous === false) {
             var newPromise = api.createSync('wishlist').getOrCreate(require.mozuData('user').accountId).then(function(wishlist) {
                 return wishlist.data;
             }).then(function(wishlistItems) {
                 for (var j = 0; j < productCodesShown.length; j++) {
                     for (var i = 0; i < wishlistItems.items.length; i++) {
                         if (wishlistItems.items[i].product.productCode == productCodesShown[j]) {
                             $(productsWishlistBtns[j]).prop('disabled', 'disabled');
                             $(productsWishlistBtns[j]).addClass("addedToWishlist");
                         }
                     }
                 }
             });
         }
     },

     getMaxHeight: function(selector) {
         return Math.max.apply(null, $("" + selector).map(function ()
         {
             return $(this).height();
         }).get());
     },
     manageBlocksHeight: function() {
         try {
             var self = this;
         } catch (err) {
             /*ignore*/
         }
     },
     priceFunction: function() {
         $('.mz-price').each(function() {
             var amountText = $(this).data("total-amount");
             var amountString = amountText.toString();
             var amountDollar = amountString.charAt(0);
             var totalp = amountString.split(amountDollar);
             var decimal = totalp[1].split('.');
             var afterDecimal = decimal[1];
             if(afterDecimal == '00') {
                 $(this).html('<span class="dollar">'+amountDollar+'</span>'+decimal[0]);
             } else {
                 $(this).html('<span class="dollar">'+amountDollar+'</span>'+'<span class="interger">'+decimal[0]+'</span>'+'<sup>'+decimal[1]+'</sup>');
             }
         });
     }
 });
//End Carousel view def***

var getMozuProducts = function(rtiProductList){
    var deferred = api.defer();
    var numReqs = rtiProductList.length;
    var productList = [];
    var filter = "";
    _.each(rtiProductList, function(attrs) {
        if (filter !== "") filter += " or ";
        filter += "productCode eq "+ attrs.ProductId;    
    });
    var op = api.get('products', filter);
    op.then(function(data) {
        _.each(data.data.items, function(product){
            
          var rtiProduct = _.findWhere(rtiProductList, {ProductId: product.productCode});
          
              product.rtiRank = rtiProduct.rank||'';
              product.slot = rtiProduct.slot||'';
              product.widgetId = rtiProduct.widgetId||'';
              product.href = rtiProduct.url||'';      
              productList.push(product);
        });
       _.defer(function() {
           deferred.resolve(productList);
       });
  
    }, function(reason){
      _.defer(function() {
      deferred.resolve(productList);
      });
    });
     return deferred.promise;
  };
  

 var renderData = function(data) {

     _.each(containerList, function(container){

       var placeholder = container.config.placeholder;
       var numberOfItems = container.config.quantity;
       var configTitle = container.config.title;
       var format = container.config.format;

       /*
       Our data will contain information about lots of different possible widgets.
       First we want to reduce that data to only the placeholderName we're dealing with.
       */
       var currentProducts = $.grep(data, function(e){ return e.placeholderName == placeholder; });
       /*
       We should at this point have a list of results with the correct placeholderName,
       and that last should only be 1 item long.
       If that first item doesn't exist, there was a problem.
       */
       if (!currentProducts[0]){
         if (pageContext.isEditMode){
           /*
           If we reach this point, it means there wasn't a placeholderName in the
           data that was returned that matches the one we selected.
           */
           $('.recommended-product-container.'+placeholder).text("Placeholder not found.");
         }
       } else {
         //We have the data for our widget now. Time to fill it up.
         var displayName;
         //if configTitle has a value, the user entered a title to
         //override the title set in RTI.
         if (configTitle){
           displayName = configTitle;
         } else {
           //if configTitle has no value, we get the title from the
           //product results call
           displayName = currentProducts[0].displayName;
         }

         //We slice the productList we received according to the limit set
         //in the editor
        var productList;
         if (currentProducts[0].productList.length>numberOfItems){
           productList = currentProducts[0].productList.slice(0, numberOfItems);
         } else {
           productList = currentProducts[0].productList;
         }

         //Turns list of product IDs into a product collection
         getMozuProducts(productList).then(function(products){
           if(products.length !== 0) {
               var productsByRank = _.sortBy(products, 'rtiRank');
               productList = productsByRank;
               var prodColl = new ProductModels.ProductCollection();
               prodColl.set('items', productList);
               prodColl.set('bnData', data.bnData);
               //Time to actually render

               if (currentProducts[0].editModeMessage){
                 if (pageContext.isEditMode){
                   $('.recommended-product-container.'+placeholder).text(currentProducts[0].editModeMessage);
                 }
               } else {
               $("."+placeholder+".slider-title").text(displayName);
               if (!format){
                 format = "carousel";
               }
               if (format == "carousel"){
                 var productListView = new ProductListView({
                      el: $('[data-rti-recommended-products='+placeholder+']'),
                      model: prodColl
                  });
                 productListView.render(placeholder);
                 return;

               } else if (format == "grid"){
                 var gridListView = new GridView({
                    el: $('[data-rti-recommended-products='+placeholder+']'),
                    model: prodColl
                 });
                 gridListView.render(placeholder);
                 return;
               }
             }
             } else {
               if (pageContext.isEditMode){
                 $('.recommended-product-container.'+placeholder).text("There was a problem retrieving products from your catalog that match the products received from RTI.");
               }
             }
         });
       }
     });
   };

 try {
     var productInstance = RecommendedProducts.getInstance(rtiOptions);
     productInstance.getProductData(function(data){
       renderData(data);
     });
 } catch(err) {
   console.log(err);
 }
 /*Recommended Product Code Ends*/

});
