require([
    "modules/jquery-mozu",
    "underscore",
    'modules/block-ui',
    "hyprlive",
    "modules/backbone-mozu",
    "hyprlivecontext",
    "modules/api",
    "async",
    'modules/my-account-order-status',
    'modules/models-order-status',
    'modules/models-product',
    'modules/editable-view'
], function($, _, blockUiLoader, Hypr, Backbone, HyprLiveContext, api, async, OrderStatusApi, OrderStatusModels, ProductModels,  EditableView) {

    var getMozuProducts = function(orderProductList) {
            var deferred = api.defer();
            var numReqs = orderProductList.length;
            var productList = [];
            var filter = "";
            _.each(orderProductList, function(attrs) {
                if (filter !== "") filter += " or ";
                filter += "productCode eq "+ attrs;    
            });
            var op = api.get('products', filter);                
            op.then(function(data) {
                console.log('OrderStatusDetail::getMozuProducts() --> in then result data: ', data); 
                if (data.data.items && data.data.items.length === 0) {
                    _.defer(function() {
                        deferred.resolve(productList);
                    });
                }
                _.each(data.data.items, function(product){
                    productList.push(product);
                    _.defer(function() {
                        deferred.resolve(productList);
                    });
                });

            }, function(reason){
                _.defer(function() {
                    deferred.resolve(productList);
                });                    
            });
        return deferred.promise;
    };

    var OrderStatusView =  EditableView.extend({ //Backbone.MozuView.extend({
    templateName: "modules/order/order-status-detail",
    render: function() {
         Backbone.MozuView.prototype.render.apply(this);


         return this;
     },  
    additionalEvents: {
        'click a.mz-orderstatus-button' : 'returnToOrderList'
    }, 
    returnToOrderList: function(event) {
        if (!require.mozuData('pagecontext').isEditMode) {
            window.location.href = (HyprLiveContext.locals.siteContext.siteSubdirectory || '') + '/myaccount?sec=orderhistory';
        }
    },
    returnToMyDash: function(event) {
        if (!require.mozuData('pagecontext').isEditMode) {
            window.location.href = (HyprLiveContext.locals.siteContext.siteSubdirectory || '') + '/myaccount';
        }
    },
    returnToPersonalInfo: function(event) {
        if (!require.mozuData('pagecontext').isEditMode) {
            window.location.href = (HyprLiveContext.locals.siteContext.siteSubdirectory || '') + '/myaccount?sec=accountsettings';
        }
    },
    returnToWhishlist: function(event) {
        if (!require.mozuData('pagecontext').isEditMode) {
            window.location.href = (HyprLiveContext.locals.siteContext.siteSubdirectory || '') + '/myaccount?sec=wishlist';
        }
    },
    returnToPayment: function(event) {
        if (!require.mozuData('pagecontext').isEditMode) {
            window.location.href = (HyprLiveContext.locals.siteContext.siteSubdirectory || '') + '/myaccount?sec=paymentmethods';
        }
    },
    returnToAddress: function(event) {
        if (!require.mozuData('pagecontext').isEditMode) {
            window.location.href = (HyprLiveContext.locals.siteContext.siteSubdirectory || '') + '/myaccount?sec=addressbook';
        }
    },


    addItemToCart: function(e) {
        var self = this,
            $target = $(e.currentTarget),
            id = $target.data('mzItemId');
        if (id) {
            
            return this.doModelAction('addItemToCart', id);
        }
    }
  });

  function getParams() {
  	var location = window.location || { search: "" },
  		params = location.search.slice(1).split('&'),
      paramMap = {};

  	_.each(params, function(param, idx) {
  		params[idx] = decodeURIComponent( params[idx] );
      var splitParam = param.split('=');
      if(splitParam.length == 2){
          paramMap[splitParam[0]] = splitParam[1];
      }
  	});
   return paramMap;
  }

  $(document).ready(function(event){
    var params = getParams();
    if(params && params.order) {
        blockUiLoader.globalLoader();
        OrderStatusApi.OrderStatusDetail.getOrderStatusDetail( { orderId: params.order }).then( function( data ){
            console.log('Data in then ', data); 
            if( data  ){
                var orderStatusModel = new OrderStatusModels.OmxOrderStatus(data);

                var productIds = []; 

                data.orderDetail.OrderDetail[0].LineItem.forEach( function(lineItem) {
                    productIds.push(lineItem.FulfillmentReference[0]); 
                }); 
                
                getMozuProducts(productIds).then(function (products) {
                    var prodColl; 
                    if (products.length !== 0) {
                        prodColl = new ProductModels.ProductCollection();
                        prodColl.set('items', products);
                    } 

                    orderStatusModel.attributes.orderDetail.ProductCollection= prodColl; 
                    orderStatusModel.attributes.orderDetail.OrderDetail[0].LineItem.forEach( function(lineItem) {
                        var apiProduct = ''; 
                        if (lineItem.ItemCode[0]._ != 'MLCOUPON') {
                            prodColl.attributes.items.models.forEach( function(pInApi) {
                                if (lineItem.ItemCode[0]._ === pInApi.attributes.productCode ){
                                    apiProduct = pInApi; 
                                }
                            });
                            if (apiProduct) {
                                lineItem.url = apiProduct.attributes.url; 
                                lineItem.image = apiProduct.attributes.content.attributes.productImages[0].imageUrl; 
                            }
                        }
                    }); 

                    var omxOrderStatusView = new OrderStatusView({
                        el: $( '#order-status-detail' ),
                        model: orderStatusModel,
                        messagesEl: $('[data-mz-message-bar]')
                    });
    
                    //self.render();
                    window.orderStatusView = omxOrderStatusView;
                    omxOrderStatusView.render();
                    blockUiLoader.unblockUi();
/*                productIds.forEach(function(prodCode){
                    api.get('product', { productCode: prodCode }).then(function(product) {
                            console.log(product.prop('productCode')); // -> 'EXAMPLE123'
                            console.log(product.data.productCode); // -> 'EXAMPLE123'
    
                    }).catch(function(error) {
                        console.log('issue in the apiCall to Product', error);
                    }); */

                });
            }
        },function(error){
        console.log('error during the api call', error);
        $('[data-mz-message-bar]').html(error.responseJSON.message);
        blockUiLoader.unblockUi();
        });
    }

    $('.mz-myaccount-nav .dl-accountDashboard').on('click', function (e) {
        if(e) e.preventDefault();
        window.orderStatusView.returnToMyDash(e); 
    }); 
    $('.mz-myaccount-nav .dl-personalInfo').on('click', function (e) {
        if(e) e.preventDefault();
        window.orderStatusView.returnToPersonalInfo(e); 
    }); 
    $('.mz-myaccount-nav .dl-addressbook').on('click', function (e) {
        if(e) e.preventDefault();
        window.orderStatusView.returnToAddress(e); 
    }); 
    $('.mz-myaccount-nav .dl-paymentmethods').on('click', function (e) {
        if(e) e.preventDefault();
        window.orderStatusView.returnToPayment(e); 
    }); 
    $('.mz-myaccount-nav .dl-orderhistory').on('click', function (e) {
        if(e) e.preventDefault();
        window.orderStatusView.returnToOrderList(e); 
    }); 
    $('.mz-myaccount-nav .dl-returns').on('click', function (e) {
        if(e) e.preventDefault();
        window.orderStatusView.returnToMyDash(e); 
    }); 
    $('.mz-myaccount-nav .dl-accountwishlist').on('click', function (e) {
        if(e) e.preventDefault();
        window.orderStatusView.returnToWhishlist(e); 
    }); 


    $('.mz-scrollnav-item').removeClass('active');
    $('.mz-scrollnav-item.dl-orderhistory').addClass('active');

    });
});
