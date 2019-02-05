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
    'modules/editable-view'
], function($, _, blockUiLoader, Hypr, Backbone, HyprLiveContext, api, async, OrderStatusApi, OrderStatusModels, EditableView) {


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
                console.log('OmxOrderStatus ', orderStatusModel);
                var omxOrderStatusView = new OrderStatusView({
                    el: $( '#order-status-detail' ),
                    model: orderStatusModel,
                    messagesEl: $('[data-mz-message-bar]')
                });

                //self.render();
                window.orderStatusView = omxOrderStatusView;

                omxOrderStatusView.render();
                blockUiLoader.unblockUi();
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
