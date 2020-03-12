define(['hyprlive', 'underscore', 'modules/jquery-mozu', "hyprlivecontext", "modules/models-product", 'modules/api'], function(Hypr, _, $, HyprLiveContext, ProductModels, api) {
    if (window.metricsEngine === undefined) {
               
        var metricsEngine = {
            
            init: function() {
                
                metricsEngine.googleTagManagerEnabled = Hypr.getThemeSetting('googleTagManagerEnabled');
                metricsEngine.impressions = [];
                metricsEngine.currentProduct = false;
                metricsEngine.push = false;
                metricsEngine.debug = true;
            },
            
            getGAProduct: function(cartitemObject, product, qty) {
                               
                var gaProduct = {'name': product.get('content').get('productName'),
                                'id': product.get('productCode'),
                                'sku': cartitemObject.product.mfgPartNumber,
                                'price': cartitemObject.taxableTotal,
                                'originalPrice': cartitemObject.unitPrice.listAmount,
                                'brand': metricsEngine.getProductBrand(product),
                                'category': metricsEngine.getProductCategory(product),
                                'subscription': metricsEngine.getProductSubscription(product),
                                'quantity': qty,
                                'variant': metricsEngine.getProductVariant(cartitemObject)};
                return gaProduct;
            },
            getList: function(){
                
                var pageContext = require.mozuData('pagecontext');
                if(pageContext.pageType === "web_page"){
                    if(pageContext.cmsContext.template.path === "home") return 'Home Page: Best Sellers';
                    if(pageContext.cmsContext.page.path === "routine-builder") return 'Regimen Page: Recommended';
                    return 'Quiz Page: Recommended'; //quiz page
                }
                if(pageContext.pageType === "cart") return 'Basket: Free Samples';
                return 'directory';    
            },
            getProductCategory: function(product){
                
                var category = '';
                var bdc = require.mozuData('navigation').breadcrumbs;
                if(bdc && bdc.length){ //is plp
                    var i;
                    for (i = 0; i < bdc.length; i++) {
                        var crumb = bdc[i];
                        if(!crumb.isHidden) category += crumb.name;
                        if(i+1 < bdc.length) category += "/";
                    }
                }else if(product.get('categories')){
                    var lowerCategory = '';
                    $(product.get('categories')).each(function(index, cat){
                        // TO-DO: validate and give priority to Primary Category, else procced with current logic.
                        if(!lowerCategory || (cat.categoryId < lowerCategory.categoryId && cat.isDisplayed)){
                            lowerCategory = cat;
                        }
                    });
                    category = lowerCategory.content.name+"/"+product.get('content').get('productName');
                }else{ //product has not categories set
                    category = product.get('content').get('productName');    
                }
                
                return category;
            },
            getProductBrand: function(product){
                
                var brand = '';
                var properties = product.get('properties');
                $(properties).each(function(index, property){
                    if(property.attributeFQN === 'tenant~brand-name'){
                        var values = property.values[0];
                        brand = values.stringValue;
                    }
                });                
                return brand;
            },
            getProductVariant: function(cartitemObject){
                
                var variant = '';
                var options = cartitemObject.product.options;
                $(options).each(function(index, option){ variant = option.stringValue; });
                return variant;
            },
            getProductSubscription: function(product){
            
                var autoship = $('[name="'+product.get('productCode')+'_autoShipRadio"]:checked');
                if(autoship && $(autoship).attr('value') === "1"){
                    var title = $('[data-id="mz_pdp_autoship_code"]').attr('title');
                    return $.trim(title.replace('(most common)',''));
                }else{
                    return 'One Time Purchase';    
                }
            },
            dataLayerPush: function(){
                
                var push = metricsEngine.push;
                if (!metricsEngine.googleTagManagerEnabled || !push) return false;
                
                if(metricsEngine.debug) console.log('metrics dataLayer.push', push);                                            
                window.dataLayer.push(push);
                return true;                
            },
            
            initAddToCartObserver: function(){
                
                $('.mz-productdetail-addtocart').on("click", function () {
                    metricsEngine.currentProduct = $(this).data('mzProductCode')?$(this).data('mzProductCode'):$(this).data('mz-product-code');
                    if(!metricsEngine.currentProduct){ //is quickview or pdp product
                        var prod = (window.quickviewProduct)?window.quickviewProduct:ProductModels.Product.fromCurrent();
                        metricsEngine.currentProduct = prod.id;
                    }
                });
                $('[data-mz-role="cartcount"]').bind('DOMSubtreeModified', function(e) { //top cart is updated on addtocart response
                    if(metricsEngine.currentProduct){
                        metricsEngine.triggerTrackAddToCart();
                        metricsEngine.currentProduct = false;
                    }
                });     
            },
            triggerTrackAddToCart: function(){
                
                var productCode = metricsEngine.currentProduct;
                api.get("cart").then(function(resp) {
                    if(resp.data.items.length){
                        var lastMessage = resp.data.changeMessages && resp.data.changeMessages.slice(-1)[0];
                        var lastProductAddedCode = lastMessage.metadata[0].productCode;
                        if(lastProductAddedCode === productCode){
                            _.each(resp.data.items, function(cartitem){
                                if(cartitem.product.productCode === productCode){
                                    api.get('product', productCode).then(function(productResponse){
                                        var product = new ProductModels.Product(productResponse.data);           
                                        window.metricsEngine.trackAddToCart(cartitem, product);    
                                    });
                                }
                            });
                        }
                    }
                });    
            },
            trackAddToCart: function(cartitemObject, product) {
                
                if (metricsEngine.googleTagManagerEnabled) {      
                    try {
                        var gaProduct = metricsEngine.getGAProduct(cartitemObject, product, product.get('quantity'));  
                        metricsEngine.push = {'event': 'addToCart',
                                              'depData': {'currencyCode': 'USD',
                                                          'add': {'actionField': {'list': metricsEngine.getList()},
                                                                  'products': [gaProduct]}}};
                        return metricsEngine.dataLayerPush();
                    } catch (ex) {
                        if(metricsEngine.debug) console.log('ex', ex);
                        return true;
                    }                        
                } 
            },
            
            initSubscriberProductObserver: function(){
              
                $('#product-detail').bind('DOMSubtreeModified', function(e) { // subscription actions refresh section, losing add-to-cart button action.
                    $('.mz-productdetail-addtocart').on("click", function () {
                        var prod = ProductModels.Product.fromCurrent();    
                        metricsEngine.currentProduct = prod.id;
                    });
                });
            },

            initSampleProductsObserver: function(){
                
                $('.mz-productdetail-addtocart').each(function(index, item){
                    var productCode = $(item).data('mzProductCode');
                    if(productCode){
                        api.get('product', productCode).then(function(productResponse){
                            metricsEngine.setImpressions(productResponse.data, "free Samples");
                        });
                    }
                });

                $('.mz-productdetail-addtocart').on("click", function () {
                    metricsEngine.currentProduct = $(this).data('mzProductCode')?$(this).data('mzProductCode'):$(this).data('mz-product-code');
                    $('#free-samples').bind('DOMSubtreeModified', function(e) { //sample product area is updated on addtocart response
                        if(metricsEngine.currentProduct && e.target.innerHTML.length > 0){
                            metricsEngine.triggerTrackAddToCart();
                            metricsEngine.currentProduct = false;//avoids several inclusions
                            metricsEngine.initSampleProductsObserver(); //when area refresh, needs new button clicks observers
                        }
                    });                    
               });
            },
            setImpressions: function(productResponseData, list){
                
                if (metricsEngine.googleTagManagerEnabled) {
                    var product = new ProductModels.Product(productResponseData);

                    var originalPrice = '';
                    var price = '';
                    if(product.get('priceRange') && product.get('priceRange').lower && product.get('priceRange').upper){
                        price = product.get('priceRange').lower.salePrice - product.get('priceRange').upper.salePrice;
                        originalPrice = price;
                    }else{
                        price = (product.get('price').onSale())?product.get('price').get('salePrice'):product.get('price').get('price');
                        originalPrice = product.get('price').get('price');
                    }
                    var gaProduct = {"name": product.get('content').get('productName'),      
                                      "id": product.get('productCode'),
                                      "price": price,
                                      "originalPrice" : originalPrice,
                                      "brand": metricsEngine.getProductBrand(product),
                                      "category": metricsEngine.getProductCategory(product),
                                      "variant": "",
                                      "list": list,
                                      "position": metricsEngine.impressions.length+1};
                    metricsEngine.impressions.push(gaProduct);
                    if(metricsEngine.impressions.length === $('.mz-productdetail-addtocart').length){
                        metricsEngine.push = {'event': 'DEPLabs',
                                              'depData': {'currencyCode': 'USD',
                                                          'impressions': metricsEngine.impressions}};
                        return metricsEngine.dataLayerPush();                                   
                    }
                }
            },

            initRemoveFromCartObserver: function(){

                $('#cart').on("click", '[data-mz-action="removeItem"]', function () {
                    var cartItem = $(this).data('mzCartItem');
                    api.get("cart").then(function(resp) {
                        if(resp.data.items.length){
                            _.each(resp.data.items, function(cartitemObject){
                                if(cartitemObject.id === cartItem){
                                    metricsEngine.currentProduct = cartitemObject;  
                                    metricsEngine.trackRemovedFromCart();
                                    metricsEngine.currentProduct = false;
                                }
                            });
                        }
                    });
                });
            },
            trackRemovedFromCart: function() {
                
                if (!metricsEngine.googleTagManagerEnabled  || !metricsEngine.currentProduct) return false;               
                                
                try {                        
                    var cartitemObject = metricsEngine.currentProduct;
                    api.get('product', cartitemObject.product.productCode).then(function(productResponse){
                        var product = new ProductModels.Product(productResponse.data);           
                        var gaProduct = metricsEngine.getGAProduct(cartitemObject, product, cartitemObject.quantity);
                        metricsEngine.push = {'event': 'removeFromCart',
                                              'depData': {'remove': {'actionField': {'list': metricsEngine.getList()},
                                                                     'products': [gaProduct]}}};
                        return metricsEngine.dataLayerPush();
                    });
                } catch (ex) {
                    if(metricsEngine.debug) console.log(ex);
                    return true;
                }
            }          
        };
        try {
            metricsEngine.init();
        } catch (ex) {
            if(metricsEngine.debug) console.log('Metrics Init Error.');
        }
        window.metricsEngine = metricsEngine;
    }

    $(document).ready(function() {
        var pageContext = require.mozuData('pagecontext');
        if(pageContext.pageType === "cart"){
            window.metricsEngine.initRemoveFromCartObserver();
            // free samples section not always load on first load, not always takes same time to load
            $('#free-samples').bind('DOMSubtreeModified', function(e) { 
                window.metricsEngine.initSampleProductsObserver();
            });
        }else{ //for home, quiz, directory and pdp pages
            setTimeout(function(){ //needs to wait for all add-to-cart buttons to load
                window.metricsEngine.initAddToCartObserver();
            },500);    
            if(pageContext.pageType === "product") window.metricsEngine.initSubscriberProductObserver();           
        }   
    });
    return window.metricsEngine;
});
