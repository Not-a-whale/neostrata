define(["modules/api", 'underscore', "modules/backbone-mozu", "hyprlive"], function(api, _, Backbone, Hypr) {

  var OmxPaymentSumary = Backbone.MozuModel.extend({
        relations: {
           LastCreditCardStatus: Backbone.Collection.extend({
                 model: Backbone.MozuModel
            }),
            LastPayDate: Backbone.Collection.extend({
                   model: Backbone.MozuModel
            }),
            LastAttemptDate: Backbone.Collection.extend({
                   model: Backbone.MozuModel
            }),
            AttemptsToDate: Backbone.Collection.extend({
                   model: Backbone.MozuModel
            }),
            MinAuthCode: Backbone.Collection.extend({
                   model: Backbone.MozuModel
            }),
            MaxAttemptsConfigured: Backbone.Collection.extend({
                   model: Backbone.MozuModel
            }),
            EarliestOverduePaymentDate: Backbone.Collection.extend({
                   model: Backbone.MozuModel
            }),
            OverduePaymentCount: Backbone.Collection.extend({
                   model: Backbone.MozuModel
            }),
            MaxOverdueDays: Backbone.Collection.extend({
                   model: Backbone.MozuModel
            })
        }
     }),
    OmxOrderStatus = Backbone.MozuModel.extend({
          relations: {
            PaymentSummary:  Backbone.Collection.extend({
                model: Backbone.MozuModel
            }),
            PaymentPlanDetails:Backbone.Collection.extend({
                model: Backbone.MozuModel
            }),
            OrderHeader:Backbone.Collection.extend({
                model: Backbone.MozuModel
            }),
            ShippingInformation:Backbone.Collection.extend({
                model: Backbone.MozuModel
            }),
            Customer:Backbone.Collection.extend({
                model: Backbone.MozuModel
            }),
            Payment:Backbone.Collection.extend({
                model: Backbone.MozuModel
            }),
            Order:Backbone.Collection.extend({
                model: Backbone.MozuModel
            })
          }
    });

      return {
          OmxOrderStatus: OmxOrderStatus
      };

});
