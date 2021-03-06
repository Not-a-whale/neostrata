/*global
$BV, jQuery, showReviewSummary
*/
require([
        'modules/jquery-mozu',
        'hyprlive',
        "modules/backbone-mozu",
        "modules/models-product",
        "modules/api",
        'modules/models-orders',
        "underscore"
    ],
    function($, Hypr, Backbone, ProductModels, Api, OrderModels,_) {
        
        if (window.bazaarvoiceEngine === undefined) {
            var bazaarvoiceEngine = {
                processBazaarVoice: function(){
                    var res = Api.get('entityList', {
                        listName: 'bvsettings@mzint',
                        id: Api.context.site
                    });
                    res.then(function(r) {
                        var data = r.data.items[0];
                        var staging = "-stg";
                        if (data.environment != "Staging") {
                            staging = "";
                        }
                        var isWidget = $(".bvProductDetail").length > 0;
                        var isROIWidget = $("#bvROIWidget").val() == 1;
                        var isContainerPage = $("#containerPage").val() == 1;
                        var deploymentZone = data.deploymentZone;
                        var locale = Api.context.locale.replace("-", "_");
                        var bvScript = "//display" + staging + ".ugc.bazaarvoice.com/static/" + data.clientName + "/"+ deploymentZone +"/" + locale + "/bvapi.js";


                        $.getScript(bvScript)
                            .done(function(script, textStatus) {
                                if (isWidget) {
                                    var currentProduct = ProductModels.Product.fromCurrent();
                                    $BV.configure('global', {
                                        productId: Api.context.locale + '-' + currentProduct.id
                                    });
                                    var tabCode = $('[data-mz-bv-config]').data('mzBvConfig').tabCode;
                                    var widgetType = $('[data-mz-bv-config]').data('mzBvConfig').widgetType;
                                    $BV.ui('rr', 'show_reviews', {
                                        doShowContent: function() {
                                            if (widgetType == "summary") {
                                                showReviewSummary();
                                            }
                                        }
                                    });

                                    $BV.ui('qa', 'show_questions', {
                                        doShowContent: function() {

                                        }
                                    });
                                } else if (isROIWidget) {
                                    var order = OrderModels.Order.fromCurrent().attributes;
                                    var orderId = order.orderNumber;                          
                                    order.attributes.forEach(function(attribute){
                                        if (attribute.fullyQualifiedName == "tenant~omx_order_number" && attribute.values.length) orderId = attribute.values[0];
                                    });
                                    var bvOrder = {};
                                    bvOrder.orderId = orderId;
                                    bvOrder.tax = order.taxTotal;
                                    bvOrder.shipping = order.shippingTotal;
                                    bvOrder.total = order.total;
                                    bvOrder.city = order.billingInfo.billingContact.address.cityOrTown;
                                    bvOrder.state = order.billingInfo.billingContact.address.stateOrProvince;
                                    bvOrder.country = order.billingInfo.billingContact.address.countryCode;
                                    bvOrder.currency = order.currencyCode;
                                    bvOrder.email = order.email;
                                    bvOrder.locale = locale;
                                    var address = {};
                                    if (order.fulfillmentInfo !== null && order.fulfillmentInfo.fulfillmentContact !== null) {
                                        address = order.fulfillmentInfo.fulfillmentContact.address;
                                        bvOrder.nickname = order.fulfillmentInfo.fulfillmentContact.firstName;
                                    } else {
                                        address = order.billingInfo.billingContact.address;
                                        bvOrder.nickname = order.billingInfo.billingContact.firstName;
                                    }
                                    bvOrder.city = address.cityOrTown;
                                    bvOrder.state = address.stateOrProvince;
                                    bvOrder.country = address.countryCode;
                                    var items = [];
                                    var skuPrefix = Api.context.locale+'-'; // {'en-US-', 'en-CA-', 'fr-CA-'}
                                    for (var i = 0; i < order.items.models.length; i++) {
                                        var lineItem = order.items.models[i].attributes;
                                        if(lineItem.unitPrice.extendedAmount === 0){
                                            continue;
                                        }
                                        var item = {};
                                        item.sku = skuPrefix+lineItem.product.attributes.productCode;
                                        item.name = lineItem.product.attributes.name.toUpperCase();
                                        if (lineItem.product.attributes.categories.length > 0) {
                                            item.category = lineItem.product.attributes.categories[0].id;
                                            item.price = lineItem.unitPrice.extendedAmount; // (lineItem.total / lineItem.quantity);
                                        }
                                        item.quantity = lineItem.quantity;
                                        if (lineItem.product.attributes.imageUrl !== null) {
                                            item.imageURL = window.location.protocol+lineItem.product.attributes.imageUrl;
                                        }
                                        items[i] = item;
                                    }
                                    bvOrder.items = items;
                                    $BV.SI.trackTransactionPageView(bvOrder);
                                } else if (isContainerPage) {
                                    $BV.container('global', {});
                                }


                                var hash = {};                     
                                var dupIdx=0;
                                $('.bvr-inline-rating').each(function() {
                                        var $this = $(this);
                                        var productCode = $this.data('bvProductCode');
                                        if (hash[productCode]){
                                            //update id
                                            var newId=$this.attr('id').replace("BVRRInlineRating","BVRRInlineRating"+dupIdx)+'__'+dupIdx;
                                            $this.attr('id',newId);

                                            var hashDup={};
                                            hashDup[productCode]={
                                                url: $this.data('mzProductUrl'),
                                                containerId: $this.attr('id')

                                            };

                                            var dupProducts = {};
                                            dupProducts.productIds = hashDup;
                                            dupProducts.containerPrefix = "BVRRInlineRating"+dupIdx;

                                            $BV.ui('rr', 'inline_ratings', dupProducts);

                                            dupIdx++;

                                         }else{   
                                            hash[productCode] = {
                                                url: $this.data('mzProductUrl'),
                                                containerId: $this.attr('id')
                                            };
                                        }

                                });

                                if (!jQuery.isEmptyObject(hash)) {
                                    var products = {};
                                    products.productIds = hash;
                                    products.containerPrefix = "BVRRInlineRating";
                                    $BV.ui('rr', 'inline_ratings', products);
                                }










                            })
                            .fail(function(jqxhr, settings, exception) {
                                console.log(jqxhr);
                            });
                    });
                }
            };   
            window.bazaarvoiceEngine = bazaarvoiceEngine;
        }

        $(document).ready(function() {
            window.bazaarvoiceEngine.processBazaarVoice();
        });
        
        return window.bazaarvoiceEngine;
    });
