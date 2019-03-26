define(["modules/api", 'underscore', "modules/backbone-mozu", "hyprlive", 'modules/models-product', "modules/api-autoreplanish"], 
    function(api, _, Backbone, Hypr, ProductModels, ApiAutoreplanish) {

   var OmxOrderHistoryItem = Backbone.MozuModel.extend({
          idAttribute: 'orderId'
      }),
      OmxItemSubscription = Backbone.MozuModel.extend({
        idAttribute: 'membershipId',
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
          }), 
          editingOrderItem: OmxItemSubscription,
        }, 
        defaults: function () {
          return {
            editingOrderItem: {}
          };
        },

        beginEditOrderItem: function (id) {
          var toEdit = this.get('items').get(id);
          if (toEdit)
              this.get('editingOrderItem').set(toEdit.toJSON({ helpers: true, ensureCopy: true }), { silent: true });
        },

        endEditOrderItem: function() {
          var editingOrderItem = this.get('editingOrderItem');
//          addressType = editingContact.get("address").get('addressType'),
  //        countryCode = editingContact.get("address").get('countryCode');
          editingOrderItem.clear();
          /*editingContact.set('accountId', this.get('id'));
          editingContact.get("address").set('addressType',addressType);
          editingContact.get("address").set('countryCode', countryCode);
          editingContact.get("address").set('candidateValidatedAddresses', null); */
        },
        getFrequencyValue: function (freq) {
          return Hypr.getThemeSetting('autoReplenishment_'+freq); 
        },
        getFrequencyMap: function (freq) {
          return Hypr.getThemeSetting('autoReplenishmentCode_'+freq); 
        },
        

        orderWaitDateUpdate: function(params) {
          console.log('omxModels - orderwaitDateUpdate ', params); 
          var me = this, 
              editingOrderItem = this.get('editingOrderItem');
          if (params) {
            params.orderNumber = editingOrderItem.get('orderNumber'); 
            params.lineItem =  editingOrderItem.get('lineNumber');  
            if (params.actionType && params.actionType == 'mz-autoreplanish-action-type-delay-ship') {
              //shipNow
              var newDate = new Date(); 
              newDate.setMonth(newDate.getMonth() + parseInt(me.getFrequencyMap(params.frequency)));
              params.newDate = newDate.getFullYear()+"-"+(newDate.getMonth() +1)+"-"+newDate.getDate();
            }
            return ApiAutoreplanish.OrderMotionApi.orderWaitDateUpdate(params).done(function(response){
              console.log('success :: ', response); 
/*              if (params.actionType == 'mz-autoreplanish-action-type-delay-ship') {
                me.get('editingOrderItem').set('frequencyCode', params.frequency);
                me.get('editingOrderItem').set('nextShipDate', params.newDate);
                me.get('editingOrderItem').set('configurationName', me.getFrequencyValue(params.frequency));
                me.get('items').push(me.get('editingOrderItem')); 
              }  */

              return true; 
            }).fail(function(err) {
              console.log('erro', err);
              return false; 
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
              
              
          return ApiAutoreplanish.OrderMotionApi.orderUpdate(params).done(function(data){
            console.log('updateNextOrderShipTo --> success', data); 
            return data; 
          }).fail(function(err){
            console.log('updateNextOrderShipTo --> error', err); 
            return false;
          });  
        }, 
        updateLineItemFrequency: function(params) {
          var me = this, 
              editingOrderItem = this.get('editingOrderItem'); 
              editingOrderItem.set('frequencyCode', params.frequency); 
//          this.syncApiModel();
          _.extend(params, {orderItem:editingOrderItem.toJSON()});
          return ApiAutoreplanish.OrderMotionApi.orderDetailUpdate(params).done(function(data){
            console.log('updateLineItemFrequency --> success', data); 
            return data; 
          }).fail(function(err){
            console.log('updateLineItemFrequency --> error', err); 
            return false; 
          }); 
        } 

      });


      return {
          OmxOrderHistoryList: OmxOrderHistoryList, 
          OmxItemSubscriptionList: OmxItemSubscriptionList
      };

});
