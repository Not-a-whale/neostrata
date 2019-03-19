define(["modules/api", 'underscore', "modules/backbone-mozu", "hyprlive", 'modules/models-product'], function(api, _, Backbone, Hypr, ProductModels) {
  
   var OmxOrderHistoryItem = Backbone.MozuModel.extend({
          idAttribute: 'orderId'
      }),
      OmxItemSubscription = Backbone.MozuModel.extend({
        idAttribute: 'orderId',
        relations: {
          product: ProductModels.Product
        }
      }),
      OmxOrderHistoryList = Backbone.Collection.extend({
        helpers: ['hasItems'],
        hasItems: function() {
            return this.length > 0;
        },
        relations: {
          items: Backbone.Collection.extend({
              model: OmxOrderHistoryItem
          })
        }
      }),
      OmxItemSubscriptionList = Backbone.MozuModel.extend({
       
        relations: {
          items: Backbone.Collection.extend({
              model: OmxItemSubscription, 
              helpers: ['hasItems'],
              hasItems: function() {
                  return this.length > 0;
              }
          })
        }
      });


      return {
          OmxOrderHistoryList: OmxOrderHistoryList, 
          OmxItemSubscriptionList: OmxItemSubscriptionList
      };

});
