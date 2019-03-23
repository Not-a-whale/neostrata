define(["modules/api", 'underscore', "modules/backbone-mozu", "hyprlive", 'modules/models-product', "modules/api-autoreplanish"], 
    function(api, _, Backbone, Hypr, ProductModels, ApiAutoreplanish) {

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
        }, 
        orderWaitDateUpdate: function(params) {
          console.log('omxModels - orderwaitDateUpdate ', params); 
          var me = this;
          if (params) {
            if (params.actionType && params.actionType == 'mz-autoreplanish-action-type-delay-ship') {
              //shipNow
              var newDate = new Date(); 
              newDate.setMonth(newDate.getMonth() + parseInt(params.frequency));
              params.newDate = newDate.getFullYear()+"-"+(newDate.getMonth() +1)+"-"+newDate.getDate();
            }
            return ApiAutoreplanish.OrderMotionApi.orderWaitDateUpdate(params).then(function(response){
              console.log('success :: ', response); 
              

            }).catch(function(err){
              console.log('error :: ', err); 
            }); 
          }
        },
        updateNextOrderShipTo: function(contact, membershipId) {
          console.log('contact : ', contact); 
          var shipTo = {
            firstName : contact.get('firstName'), 
            lastNameOrSurname : contact.get('lastNameOrSurname'),
            address : {
              address1 : contact.get('address.address1'), 
              address2 : contact.get('address.address2'),
              address3 : contact.get('address.address3'), 
              address4 : contact.get('address.address4'), 
              stateOrProvince : contact.get('address.stateOrProvince'),
              postalOrZipCode : contact.get('address.postalOrZipCode'),
              countryCode : contact.get('address.countryCode'),
            },
            phoneNumbers : {
              home : contact.get('phoneNumbers.home')
            }
          }; 

          var 
            params = {
              shippingInfo : shipTo, 
              membershipId : membershipId };
              
              
          return ApiAutoreplanish.OrderMotionApi.orderUpdate(params).then(function(data){
            console.log('updateNextOrderShipTo --> success', data); 
          }).catch(function(err){
            console.log('updateNextOrderShipTo --> error', err); 
          });  
        }, 
        updateLineItemFrequency: function(orderItem) {
          var orderItemConverted = {
           
            }, 
            params = {
              orderItem : orderItemConverted
             
            };
              
          return ApiAutoreplanish.OrderMotionApi.orderUpdate(params).then(function(data){
            console.log('updateLineItemFrequency --> success', data); 
          }).catch(function(err){
            console.log('updateLineItemFrequency --> error', err); 
          }); 
        } 

      });


      return {
          OmxOrderHistoryList: OmxOrderHistoryList, 
          OmxItemSubscriptionList: OmxItemSubscriptionList
      };

});
