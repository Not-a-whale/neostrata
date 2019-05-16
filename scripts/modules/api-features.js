define(['jquery', 'hyprlive', 'modules/api','underscore'],
  function($, Hypr, api, _ ){

      var NeostrataFeatureApi = {
          updateCustomerPreferences: function( params ) {
            var urlParts = window.location.href.split("/");
            var ccOrdesStatusURL = urlParts[0] + "//" + urlParts[2] + '/quiz/updateCustomerPreferences';
            _.extend(params, {anonymous:false});
            console.log('api-neostratafeatures-updateCustomerPreferences :: params:: ',params);
            console.log('api-neostratafeatures-updateCustomerPreferences :: ccOrdesStatusURL:: ',ccOrdesStatusURL);
            return $.post( ccOrdesStatusURL, params );
          }
      };

      return {
        NeostrataFeatureApi: NeostrataFeatureApi
      };
  });
