define(["modules/api", 'underscore', "modules/backbone-mozu", "hyprlive"], function(api, _, Backbone, Hypr) {

   var OmxOrderHistoryItem = Backbone.MozuModel.extend({
          idAttribute: 'orderId'
      }),
      OmxOrderHistoryList = Backbone.Collection.extend({
        helpers: ['hasItems'],
        hasItems: function() {
            console.log('models-omxorder.js --> OmxOrderHistoryList -->hasItems()--Start'); 
            console.log('models-omxorder.js --> OmxOrderHistoryList -->hasItems() --> THIS', this); 
            return this.length > 0;
        },
        relations: {
          items: Backbone.Collection.extend({
              model: OmxOrderHistoryItem
          })
        }
      });

      return {
          OmxOrderHistoryList: OmxOrderHistoryList
      };

});
