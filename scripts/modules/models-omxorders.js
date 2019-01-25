define(["modules/api", 'underscore', "modules/backbone-mozu", "hyprlive"], function(api, _, Backbone, Hypr) {

   var OmxOrderHistoryItem = Backbone.MozuModel.extend({
          idAttribute: 'orderId'
      }),
      OmxOrderHistoryList = Backbone.Collection.extend({
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
