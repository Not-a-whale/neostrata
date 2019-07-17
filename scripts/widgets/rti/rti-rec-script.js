
require([
    'modules/jquery-mozu',
    'hyprlive',
    "hyprlivecontext",
    'underscore',
    'modules/api',
    'modules/backbone-mozu',
    'modules/models-product',
    'widgets/rti/recommended-products',
    'bxslider',
    "modules/cart-monitor",
    "modules/metrics",
    'swiper'
    //'vendor/jquery/jquery-ui'
],
    function ($, Hypr, HyprLiveContext, _, api, Backbone, ProductModels, RecommendedProducts, bxslider, CartMonitor, MetricsEngine, Swiper) {

        var req = api.get('entityList', {
            listName: 'bvsettings@mzint',
            id: api.context.site
        }).then(function (res) {
            var data = res.data.items[0];
            var staging = data.environment != 'Staging' ? '' : '-stg';
            var locale = api.context.locale.replace("-", "_");
            var script = "//display" + staging + ".ugc.bazaarvoice.com/static/" + data.clientName + "/" + data.deploymentZone + "/" + locale + "/bvapi.js";

            $.getScript(script)
                .done(function () {
                    console.log("BV success");
                })
                .fail(function (jqxhr, settings, exception) {
                    console.error('BazaarVoice failed to load.', exception);
                });
        }).catch(function (err) {
            console.warn(err);
            console.log('Initializing match-tool without BazaarVoice.');
        });

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
        $('.recommended-product-container').each(function () {
            if (!$(this).hasClass('ignore')) {
                var configData = $(this).data('mzRtiRecommendedProducts');
                //displayOptions are individual to each container.
                var displayOptions = {
                    title: configData.title || "",
                    quantity: configData.numberOfItems || "",
                    format: configData.displayType || "",
                    placeholder: configData.placeholder || ""
                };
                var container = { config: displayOptions };
                var selector = '.recommended-product-container.' + configData.placeholder;

                if ($(selector).length > 1) {
                    $(selector).each(function (index, element) {
                        if (index > 0) {
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
                            if (pageContext.isEditMode) {
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
            templateName: 'Widgets/RTI/rti-product-tiles',
            initialize: function () {
                var self = this;

            },
            render: function (placeholder) {
                var elSelector = ".rti-recommended-products." + placeholder;
                var self = this;
                Backbone.MozuView.prototype.render.apply(this, arguments);
            }
        });
        //End Grid view definition***
        //***Start Carousel view def:
        var ProductListView = Backbone.MozuView.extend({
            templateName: 'modules/product/rti-product-list'
        });
        //End Carousel view def***

        var getMozuProducts = function (rtiProductList) {

            var deferred = api.defer();
            var numReqs = rtiProductList.length;
            var productList = [];
            var filter = "";
            _.each(rtiProductList, function (attrs) {
                if (filter !== "") filter += " or ";
                filter += "productCode eq " + attrs.ProductId;
            });
            var op = api.get('products', filter);
            op.then(function (data) {
                _.each(data.data.items, function (product) {

                    var rtiProduct = _.findWhere(rtiProductList, { ProductId: product.productCode });
                    product.rtiRank = rtiProduct.rank || '';
                    product.slot = rtiProduct.slot || '';
                    product.widgetId = rtiProduct.widgetId || '';
                    product.href = rtiProduct.url || '';
                    productList.push(product);
                    _.defer(function () {
                        deferred.resolve(productList);
                    });
                });

            }, function (reason) {
                _.defer(function () {
                    deferred.resolve(productList);
                });
            });
            return deferred.promise;
        };

        var renderData = function (data) {

            _.each(containerList, function (container) {

                /**New priority setup: first Buy it again, then Recently Viewed, then default. ref: https://jira.deplabs.com/browse/NEOSUP-1294 **/
                var placeholder = container.config.placeholder;
                var numberOfItems = container.config.quantity;
                var configTitle = container.config.title;
                var format = container.config.format;

                var displayName = false;
                    
                var placeholderBuyItAgain = 'homeBuyItAgain';
                var placeholderRecenltyViewed = 'homeRecenltyViewed';
                var placeholderOurBestsellers = 'homeBestSellers';
                var placeholderConditionQuiz = 'homeConditionQuiz';
                var placeHolders = [placeholderBuyItAgain, placeholderRecenltyViewed, placeholderOurBestsellers, placeholderConditionQuiz];
                
                var fullProductList = [];
                var productListByPlaceholder = [];
                var existingProductsByPlaceholder = [];
                placeHolders.forEach(function(placeHoldersItem){ 
                    existingProductsByPlaceholder[placeHoldersItem] = []; 
                    productListByPlaceholder[placeHoldersItem] = []; 
                    
                });
                
                data.forEach(function(col){ //rti returns on single call all placeholders products, let's sort and verify all at once.
                    col.productList.forEach(function(prodList){ productListByPlaceholder[col.placeholderName].push(prodList.ProductId); });
                    fullProductList = fullProductList.concat(col.productList);
                });
                if(!fullProductList.length) return ;
                    
                getMozuProducts(fullProductList).then(function (products) { //async calls, all needs to be inside this..                
                    products.forEach(function(product){
                        if(product.productType !== "Free Sample"){
                            placeHolders.forEach(function(placeholderItem){
                                var aux = productListByPlaceholder[placeholderItem];
                                if(aux.indexOf(product.productCode) !== -1) existingProductsByPlaceholder[placeholderItem].push(product);    
                            });
                        }
                    });
                    //requires to be at least 5 products length as per ticket request, ref: https://jira.deplabs.com/browse/NEOSUP-1294
                    if(existingProductsByPlaceholder[placeholderBuyItAgain] && existingProductsByPlaceholder[placeholderBuyItAgain].length > 4){
                        placeholder = placeholderBuyItAgain;
                        displayName = Hypr.getLabel(placeholderBuyItAgain);
                        products = existingProductsByPlaceholder[placeholderBuyItAgain];
                    }else if(existingProductsByPlaceholder[placeholderRecenltyViewed] && existingProductsByPlaceholder[placeholderRecenltyViewed].length > 4){
                        placeholder = placeholderRecenltyViewed;
                        displayName = Hypr.getLabel(placeholderRecenltyViewed);
                        products = existingProductsByPlaceholder[placeholderRecenltyViewed];
                    }else{
                        displayName = Hypr.getLabel(placeholderOurBestsellers);
                        products = existingProductsByPlaceholder[placeholderOurBestsellers];
                    }
                    
                    $('.recommended-product-container').addClass(placeholder);
                    $('.rti-recommended-products-title').addClass(placeholder);
                    $('.rti-recommended-products').addClass(placeholder);
                    
                    
                    if (pageContext.isEditMode) {
                        $('.recommended-product-container.' + placeholder).text('<b>Here Goes your RTI Recommended items</b>');
                        return;
                    }  
                    /*
                    Our data will contain information about lots of different possible widgets.
                    First we want to reduce that data to only the placeholderName we're dealing with.
                    */
                    var currentProducts = $.grep(data, function (e) {
                        return e.placeholderName == placeholder;
                    });
                    /*
                    We should at this point have a list of results with the correct placeholderName,
                    and that last should only be 1 item long.
                    If that first item doesn't exist, there was a problem.
                    */
                    if (!currentProducts[0]) {
                        if (pageContext.isEditMode) {
                            /*
                            If we reach this point, it means there wasn't a placeholderName in the
                            data that was returned that matches the one we selected.
                            */
                            $('.recommended-product-container.' + placeholder).text("Placeholder not found.");
                        }
                    } else {
                        //We have the data for our widget now. Time to fill it up.
                        //var displayName;
                        //if configTitle has a value, the user entered a title to
                        //override the title set in RTI.
                        if(!displayName){
                            if (configTitle) {
                                displayName = configTitle;
                            } else {
                                //if configTitle has no value, we get the title from the
                                //product results call
                                displayName = currentProducts[0].displayName;
                            }
                        }
                        $('.slider-title.rti-recommended-products-title.' + placeholder).text(displayName);

                        //We slice the productList we received according to the limit set
                        //in the editor
                        var productList;
                        if (currentProducts[0].productList.length > numberOfItems) {
                            productList = currentProducts[0].productList.slice(0, numberOfItems);
                        } else {
                            productList = currentProducts[0].productList;
                        }
                        if (products > numberOfItems) products = products.slice(0, numberOfItems);
                        
                        //Turns list of product IDs into a product collection
                        //getMozuProducts(productList).then(function (products) {
                            if (products.length !== 0) {
                                var productsByRank = _.sortBy(products, 'rtiRank');
                                productList = productsByRank;
                                var prodColl = new ProductModels.ProductCollection();
                                prodColl.set('items', productList);
                                prodColl.set('bnData', data.bnData);
                                prodColl.set('config', container.config);
                                //BNData for multiple widgets
                                if (productList.length) {
                                    var firstItem = productList[0];
                                    window.BNData = window.BNData || '';
                                    window.BNWidgetId = window.BNWidgetId || '';
                                    if (window.BNData) {
                                        if (window.BNData.widgetCount) {
                                            window.BNData.widgetCount += 1;
                                            window.BNData.widget[firstItem.widgetId] = data.bnData;
                                        }
                                        else {
                                            var oldBNData = window.BNData;
                                            window.BNData = {
                                                widgetCount: 2,
                                                widget: {}
                                            };
                                            window.BNData.widget[firstItem.widgetId] = data.bnData;
                                            window.BNData.widget[window.BNWidgetId] = oldBNData;
                                        }
                                    }
                                    else {
                                        window.BNData = data.bnData;
                                        window.BNWidgetId = firstItem.widgetId;
                                    }
                                }
                                else {
                                    window.BNData = data.bnData;
                                }
                                //Time to actually render
                                if (currentProducts[0].editModeMessage) {
                                    if (pageContext.isEditMode) {
                                        $('.recommended-product-container.' + placeholder).text(currentProducts[0].editModeMessage);
                                    }
                                } else {
                                    $('.recommended-product-container.' + placeholder + ' .mz-related-products.hidden-print').html('<h3 class="' + placeholder + ' slider-title"><span>' + displayName + '</span></h3>');
                                    if (!format) {
                                        format = "carousel";
                                    }
                                    if (format == "carousel") {
                                        var productListView = new ProductListView({
                                            el: $("." + placeholder + '.rti-recommended-products'),
                                            model: prodColl
                                        });
                                        productListView.render();
                                        var getPage = pageContext.cmsContext.template.path;
                                        var getSliderParams = { slideWidth: 257, homePageRtiImages: 3, slideMargin: 2 };
                                        var queryMobile = Modernizr.mq('(min-width: 767px)');
                                        if (getPage == 'home') {
                                            getSliderParams.slideWidth = HyprLiveContext.locals.themeSettings.homePageRtiImageWidth;
                                            getSliderParams.homePageRtiImages = HyprLiveContext.locals.themeSettings.homePageRtiImages;
                                        }
                                        if (Modernizr.mq('(min-width: 768px)') && Modernizr.mq('(max-width: 1024px)')) {
                                            getSliderParams.slideWidth = 225;
                                        }
                                        if (Modernizr.mq('(min-width: 320px)') && Modernizr.mq('(max-width: 767px)')) {
                                            getSliderParams.slideWidth = HyprLiveContext.locals.themeSettings.mobileSlideWidth;
                                            getSliderParams.slideMargin = HyprLiveContext.locals.themeSettings.mobileSlideMargin;
                                            getSliderParams.homePageRtiImages = HyprLiveContext.locals.themeSettings.mobileSlideMaxImages;
                                        }
                                        if (productList.length > 1) {
                                            $("." + placeholder + '.rti-recommended-products').slick({
                                                slidesToShow: 4,
                                                slidesToScroll: 1,
                                                infinite: false,
                                                prevArrow: '<i class="fa fa-caret-left" aria-hidden="true"></i>',
                                                nextArrow: '<i class="fa fa-caret-right" aria-hidden="true"></i>',
                                                responsive: [{
                                                    breakpoint: 992,
                                                    settings: {
                                                        arrows: true,
                                                        slidesToShow: 3
                                                    }
                                                },
                                                {
                                                    breakpoint: 768,
                                                    settings: {
                                                        arrows: true,
                                                        slidesToShow: 1
                                                    }
                                                }
                                                ]
                                            });
                                        } else if (productList.length === 1) {
                                            $("[data-mz-product]").find('img').addClass('single-img-width');
                                        }
                                        if (productList.length === 0) {
                                            $("." + placeholder + '.recommended-product-container').hide();
                                        }
                                        return;

                                    }
                                    else if (format == "grid") {
                                        var gridListView = new GridView({
                                            el: $('[data-rti-recommended-products=' + placeholder + ']'),
                                            model: prodColl
                                        });
                                        gridListView.render(placeholder);
                                        return;
                                    }
                                }
                            } else {
                                if (pageContext.isEditMode) {
                                    $('.recommended-product-container.' + placeholder).text("There was a problem retrieving products from your catalog that match the products received from RTI.");
                                }
                            }
                        //});
                    } 
                    
                });
            });

            var productIds = [];

            var config = {
                attributes: true,
                childList: true,
                characterData: true
            };

            var observer = new MutationObserver(function (mutations) {
                if ($(".rti-recommended-products.carousel-parent").has($('.product-listing-container')).length) {
                    initOnce();
                }

            });

            observer.observe(document.body, config);

            var didInit = false;
            function initOnce() {
                if (!didInit) {

                    $('.rti-recommended-products [data-bv-product-code]').each(function (el) {
                        var code = $(this).data('mzProductCode');
                        productIds[code] = {
                            url: '/p/' + code,
                            containerId: 'BVRRInlineRating-' + code
                        };
                    });

                    var swiper = new Swiper('.rti-recommended-products .swiper-container', {
                        slidesPerView: 3,
                        spaceBetween: 0,
                        loop: false,
                        navigation: {
                            nextEl: '.swiper-button-next',
                            prevEl: '.swiper-button-prev'
                        },
                        preventClicks: false,
                        preventClicksPropagation: false,
                        breakpoints: {
                            1024: {
                                slidesPerView: 3
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

                    var user = require.mozuData('user');
                    api.createSync('wishlist').getOrCreate(user.accountId).then(function (wishlist) {
                        return wishlist.data;
                    }).then(function (wishlistItems) {
                        for (var i = 0; i < wishlistItems.items.length; i++) {
                            if ($('[data-mz-product-code="' + wishlistItems.items[i].product.productCode + '"]')) {
                                $('[data-mz-product-code="' + wishlistItems.items[i].product.productCode + '"]').data('mz-item-id', wishlistItems.items[i].id);
                                $('[data-mz-product-code="' + wishlistItems.items[i].product.productCode + '"]').data('mz-wishlist-id', wishlistItems.id);
                                $('[data-mz-product-code="' + wishlistItems.items[i].product.productCode + '"]').data('mz-action', "directoryRemoveFromWishlist");
                                $('[data-mz-product-code="' + wishlistItems.items[i].product.productCode + '"] span').removeClass("blank-heart").addClass("filled-heart");
                            }
                        }
                    });

                    $('.product-carousel-listing .mz-productdetail-addtocart').click(function () {
                        var productCode = $(this).data('mzProductCode');
                        if (productCode && productCode !== '') {
                            api.get('product', productCode).then(function (productResponse) {
                                var product = new ProductModels.Product(productResponse.data);
                                product.addToCart();
                                product.on('addedtocart', function (cartitem) {
                                    MetricsEngine.trackDirectoryAddToCart(product, product.get('categories')[0], false, 1);
                                });
                                setTimeout(function () {
                                    CartMonitor.update('showGlobalCart');
                                    $('html, body').animate({ scrollTop: 0 }, 'normal');
                                }, 1000);
                            });
                        }
                    });
                    $('.product-carousel-listing .mz-productdetail-addtowishlist').click(function () {
                        var productCode = $(this).data('mzProductCode');
                        var _e = this;
                        if (productCode && productCode !== '') {
                            var user = require.mozuData('user');
                            if (user.accountId) {
                                var action = $(_e).data("mz-action");
                                if (action == 'directoryAddToWishlist') {
                                    api.get('product', productCode).then(function (productResponse) {
                                        var product = new ProductModels.Product(productResponse.data);
                                        product.addToWishlist();
                                        setTimeout(function () {
                                            api.createSync('wishlist').getOrCreate(user.accountId).then(function (wishlist) {
                                                return wishlist.data;
                                            }).then(function (wishlistItems) {
                                                for (var i = 0; i < wishlistItems.items.length; i++) {
                                                    if (wishlistItems.items[i].product.productCode === productCode) {
                                                        $(_e).data('mz-item-id', wishlistItems.items[i].id);
                                                    }
                                                }
                                                $(_e).data('mz-wishlist-id', wishlistItems.id);
                                                $(_e).data("mz-action", "directoryRemoveFromWishlist");
                                                if ($('#addToWishListPopUp').length === 1) {
                                                    $('#addToWishListPopUp').remove();
                                                }
                                                $('<div id="addToWishListPopUp" class="row alert" role="alert"><div class="col-xs-6 text-right">Item added to wishlist.</div><div class="col-xs-6 text-left"><a href="/myaccount#wishlist">View Wishlist</a></div></div>').insertAfter('#nav-header-container > #ml-nav');
                                                setTimeout(function () {
                                                    $('#addToWishListPopUp').fadeOut(function () { $(this).remove(); });
                                                }, 5000);
                                                return $('#wishlist-' + productCode + ' span').removeClass("blank-heart").addClass("filled-heart");
                                            });
                                        }, 1000);

                                    });
                                } else if (action == 'directoryRemoveFromWishlist') {
                                    var finishRemoveItemId = $(_e).data('mz-item-id');
                                    var wishlistId = $(_e).data('mz-wishlist-id');
                                    var serviceurl = '/api/commerce/wishlists/' + wishlistId + '/items/' + finishRemoveItemId;
                                    api.request('DELETE', serviceurl).then(function (res) {
                                        $(_e).data("mz-action", "directoryAddToWishlist");
                                        if ($('#addToWishListPopUp').length === 1) {
                                            $('#addToWishListPopUp').remove();
                                        }
                                        $('<div id="addToWishListPopUp" class="row alert" role="alert"><div class="col-xs-6 text-right">Item removed from wishlist.</div><div class="col-xs-6 text-left"><a href="/myaccount#wishlist">View Wishlist</a></div></div>').insertAfter('#nav-header-container > #ml-nav');
                                        setTimeout(function () {
                                            $('#addToWishListPopUp').fadeOut(function () { $(this).remove(); });
                                        }, 5000);
                                        return $('#wishlist-' + productCode + ' span').removeClass("filled-heart").addClass("blank-heart");
                                    });
                                }
                            } else {
                                var savedProdToWish = [];
                                if (sessionStorage.getItem('addToWishlistArr')) {
                                    savedProdToWish = JSON.parse(sessionStorage.getItem('addToWishlistArr'));
                                }
                                if (!savedProdToWish.includes(productCode)) {
                                    savedProdToWish.push(productCode);
                                    sessionStorage.setItem('addToWishlistArr', JSON.stringify(savedProdToWish));
                                    return $('#wishlist-' + productCode + ' span').removeClass("blank-heart").addClass("filled-heart");
                                } else {
                                    savedProdToWish = savedProdToWish.filter(function (item) {
                                        return item !== productCode;
                                    });
                                    sessionStorage.setItem('addToWishlistArr', JSON.stringify(savedProdToWish));
                                    return $('#wishlist-' + productCode + ' span').removeClass("filled-heart").addClass("blank-heart");
                                }
                            }
                        }
                    });

                    didInit = true;
                }
            }

            };

            try {

                var productInstance = RecommendedProducts.getInstance(rtiOptions);
                productInstance.getProductData(function (data) {
                    renderData(data);
                });



            } catch (err) {
                //console.log(err);
            }
            /*Recommended Product Code Ends*/

        });