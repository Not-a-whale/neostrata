define(['jquery', 'hyprlive', 'modules/api','underscore'],
    function($, Hypr, api, _ ){

        var OrderMotionApi = {
            updateAutoreplanishShippingInfo: function( params ) {
              var urlParts = window.location.href.split("/");
              var ccOrdesStatusURL = urlParts[0] + "//" + urlParts[2] + '/orderMotion/autoreplanish/shippingInfo';
              _.extend(params, {anonymous:false});
              console.log('api-omx-updateAutoreplanishShippingInfo :: params:: ',params);
              console.log('api-omx-updateAutoreplanishShippingInfo :: ccOrdesStatusURL:: ',ccOrdesStatusURL);
              return $.post( ccOrdesStatusURL, params );
            },
            updateAnonymousAutoreplanishShippingInfo: function( params ) {
              var urlParts = window.location.href.split("/");
              var ccOrdesStatusURL = urlParts[0] + "//" + urlParts[2] + '/orderMotion/autoreplanish/shippingInfo';
              _.extend(params, {anonymous:true});
              return $.post( ccOrdesStatusURL, params ); 
           }
        };

        return {
          OrderMotionApi: OrderMotionApi
        };
    });
