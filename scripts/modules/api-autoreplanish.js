define(['jquery', 'hyprlive', 'modules/api','underscore'],
    function($, Hypr, api, _ ){

        var OrderMotionApi = {
            orderDetailUpdate: function( params ) {
              var urlParts = window.location.href.split("/");
              var ccOrdesStatusURL = urlParts[0] + "//" + urlParts[2] + '/orderMotion/autoreplanish/orderDetailUpdate';
              _.extend(params, {anonymous:false});
              console.log('api-omx-orderDetailUpdate :: params:: ',params);
              console.log('api-omx-orderDetailUpdate :: ccOrdesStatusURL:: ',ccOrdesStatusURL);
              return $.post( ccOrdesStatusURL, params );
            },

            orderUpdate: function( params ) {
              var urlParts = window.location.href.split("/");
              var ccOrdesStatusURL = urlParts[0] + "//" + urlParts[2] + '/orderMotion/autoreplanish/orderUpdate';
              _.extend(params, {anonymous:false});
              console.log('api-omx-updateOrderUpdate :: params:: ',params);
              console.log('api-omx-updateOrderUpdate :: ccOrdesStatusURL:: ',ccOrdesStatusURL);
              return $.post( ccOrdesStatusURL, params );
            },
/*            updateAnonymousAutoreplanishShippingInfo: function( params ) {
              var urlParts = window.location.href.split("/");
              var ccOrdesStatusURL = urlParts[0] + "//" + urlParts[2] + '/orderMotion/autoreplanish/shippingInfo';
              _.extend(params, {anonymous:true});
              return $.post( ccOrdesStatusURL, params ); 
           }, */
            orderWaitDateUpdate: function(params){
              var urlParts = window.location.href.split("/");
              var ccOrdesStatusURL = urlParts[0] + "//" + urlParts[2] + '/orderMotion/autoreplanish/orderWaitDateUpdate';
              _.extend(params, {anonymous:false});
              console.log('api-omx-orderWaitDateUpdate :: params:: ',params);
              console.log('api-omx-orderWaitDateUpdate :: ccOrdesStatusURL:: ',ccOrdesStatusURL);
              return $.post( ccOrdesStatusURL, params );
            } 
        };

        return {
          OrderMotionApi: OrderMotionApi
        };
    });
