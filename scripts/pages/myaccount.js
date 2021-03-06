define(['modules/backbone-mozu', "modules/api", 'hyprlive', 'hyprlivecontext', 
    'modules/jquery-mozu', 'underscore', 'modules/models-customer', 
    'modules/views-paging', 'modules/editable-view','modules/block-ui', 
    'vendor/bootstrap-select/dist/js/bootstrap-select','modules/models-omxorders'], function(Backbone, Api, Hypr, HyprLiveContext, $, _, CustomerModels, PagingViews, EditableView,blockUiLoader) {

    var AccountSettingsView = EditableView.extend({
        templateName: 'modules/my-account/my-account-settings',
        autoUpdate: [
            'firstName',
            'lastName',
            'emailAddress',
            'acceptsMarketing'
        ],
        constructor: function() {
            EditableView.apply(this, arguments);
            this.editing = false;
            this.invalidFields = {};
        },
        initialize: function() {
            return this.model.getAttributes().then(function(customer) {
                customer.get('attributes').each(function(attribute) {
                    attribute.set('attributeDefinitionId', attribute.get('id'));
                });
                return customer;
            });

            
        },
        updateAttribute: function(e) {
            var self = this;
            var attributeFQN = e.currentTarget.getAttribute('data-mz-attribute');
            var attribute = this.model.get('attributes').findWhere({
                attributeFQN: attributeFQN
            });
            var nextValue = attribute.get('inputType') === 'YesNo' ? $(e.currentTarget).prop('checked') : $(e.currentTarget).val();

            attribute.set('values', [nextValue]);
            attribute.validate('values', {
                valid: function(view, attr, error) {
                    self.$('[data-mz-attribute="' + attributeFQN + '"]').removeClass('is-invalid')
                        .next('[data-mz-validationmessage-for="' + attr + '"]').text('');
                },
                invalid: function(view, attr, error) {
                    self.$('[data-mz-attribute="' + attributeFQN + '"]').addClass('is-invalid')
                        .next('[data-mz-validationmessage-for="' + attr + '"]').text(error);
                }
            });
        },
        startEdit: function(event) {
            if(event)
                event.preventDefault();
            $('.mz-l-stack-section').hide();
            $('.mz-l-stack-section.mz-accountsettings').show();
            $('.mz-l-stack-section.mz-passwordsection').show();
            $('.mz-l-stack-section.mz-accountsettings').removeClass('no-editing').addClass('is-editing');
            $('.mz-l-stack-section.mz-passwordsection').removeClass('is-dashboard').addClass('no-dashboard');
            $('.dl-maintitle').hide();
            $('.mz-scrollnav-item').removeClass('active');
            $('.mz-scrollnav-item.dl-personalInfo').addClass('active');
            this.editing = true;
            this.render();
        },
        cancelEdit: function() {
            this.editing = false;
            this.afterEdit();

            $('.mz-l-stack-section').removeClass('is-editing').addClass('no-editing');
            $('.mz-l-stack-section.mz-passwordsection').removeClass('no-dashboard').addClass('is-dashboard');
            $('.mz-l-stack-section').show();
            $('.dl-maintitle').show();
            $('.mz-scrollnav-item').removeClass('active');
            $('.mz-scrollnav-item.dl-accountDashboard').addClass('active');

        },
        finishEdit: function() {
            var self = this;

            $('.mz-l-stack-section').removeClass('is-editing').addClass('no-editing');
            $('.mz-l-stack-section.mz-passwordsection').removeClass('no-dashboard').addClass('is-dashboard');
            $('.mz-l-stack-section').show();
            $('.dl-maintitle').show();
            $('.mz-scrollnav-item').removeClass('active');
            $('.mz-scrollnav-item.dl-accountDashboard').addClass('active');

            this.doModelAction('apiUpdate').then(function() {
                self.editing = false;
                var source = self.model.get('acceptsMarketing') ? 'myaccount' : '';
                var pardotPayload = {
                    emailAddress: self.model.get('emailAddress'),
                    firstName: self.model.get('firstName'),
                    lastName: self.model.get('lastName'),
                    opted_out: self.model.get('acceptsMarketing') ? 0 : 1,
                    source: source
                };

                var uriEncodedParams = $.param(pardotPayload);
                var targetUrl = Hypr.getThemeSetting('pardotEmailSignupFormHandler') + '?' + uriEncodedParams;
                var call = $.ajax({
                    url: targetUrl,
                    dataType: 'jsonp',
                    jsonpCallback: 'pardotCallback',
                });
            }).otherwise(function() {
                self.editing = true;
            }).ensure(function() {
                self.afterEdit();
            });
        },
        afterEdit: function() {
            var self = this;
            self.initialize().ensure(function() {
                self.render();
            });

        }
    });

    var PasswordView = EditableView.extend({
        templateName: 'modules/my-account/my-account-password',
        autoUpdate: [
            'oldPassword',
            'password',
            'confirmPassword'
        ],
        startEditPassword: function(event) {
            event.preventDefault();
            $('.mz-l-stack-section.mz-passwordsection').removeClass('no-editing').addClass('is-editing');
            $('.mz-l-stack-section.mz-accountsettings').removeClass('no-editing-password').addClass('is-editing-password');
            this.editing.password = true;
            this.render();

        },
        finishEditPassword: function() {
            var self = this;
            this.doModelAction('changePassword').then(function() {
                _.delay(function() {
                    self.$('[data-mz-validationmessage-for="passwordChanged"]').show().text(Hypr.getLabel('passwordChanged')).fadeOut(3000);
                }, 250);
            }, function() {
                self.editing.password = true;
            });
            this.editing.password = false;
            $('.mz-l-stack-section.mz-passwordsection').removeClass('is-editing').addClass('no-editing');
            $('.mz-l-stack-section.mz-accountsettings').removeClass('is-editing-password').addClass('no-editing-password');
        },
        cancelEditPassword: function() {
            this.editing.password = false;
            this.render();
            $('.mz-l-stack-section.mz-passwordsection').removeClass('is-editing').addClass('no-editing');
            $('.mz-l-stack-section.mz-accountsettings').removeClass('is-editing-password').addClass('no-editing-password');
        }
    });

    var WishListView = EditableView.extend({
        templateName: 'modules/my-account/my-account-wishlist',
        constructor: function() {
            EditableView.apply(this, arguments);
            this.editing.wishlist = false;
            this.invalidFields = {};
        },
        addItemToCart: function(e) {
            var self = this,
                $target = $(e.currentTarget),
                id = $target.data('mzItemId');
            if (id) {
                this.editing.added = id;
                return this.doModelAction('addItemToCart', id);
            }
        },
        startEditWishlist: function(event) {
            if(event)
                event.preventDefault();

            $('.mz-l-stack-section').hide();
            $('.mz-l-stack-section.mz-accountwishlist').show();
            $('.mz-l-stack-section.mz-accountwishlist').removeClass('no-editing').addClass('is-editing');
            $('.dl-maintitle').hide();
            $('.mz-scrollnav-item').removeClass('active');
            $('.mz-scrollnav-item.dl-accountwishlist').addClass('active');
            this.editing.wishlist = true;
            this.render();
        },
        finishEditWishlist: function() {
            var self = this;
            this.doModelAction('changeWishlist').then(function() {
                _.delay(function() {
                    //self.$('[data-mz-validationmessage-for="wishlistChanged"]').show().text(Hypr.getLabel('wishlistChanged')).fadeOut(3000);
                }, 250);
            }, function() {
                self.editing.wishlist = true;
            });
            this.editing.wishlist = false;
        },
        cancelEditWishlist: function() {
            this.editing.wishlist = false;

            $('.mz-l-stack-section').removeClass('is-editing').addClass('no-editing');
            $('.mz-l-stack-section').show();
            $('.dl-maintitle').show();
            $('.mz-scrollnav-item').removeClass('active');
            $('.mz-scrollnav-item.dl-accountDashboard').addClass('active');
            this.render();
        },
        doNotRemove: function() {
            this.editing.added = false;
            this.editing.remove = false;
            this.render();
        },
        beginRemoveItem: function(e) {
            var self = this;
            var id = $(e.currentTarget).data('mzItemId');
            if (id) {
                this.editing.remove = id;
                this.render();
            }
        },
        finishRemoveItem: function(e) {
            var self = this;
            var id = $(e.currentTarget).data('mzItemId');
            if (id) {
                var removeWishId = id;
                return this.model.apiDeleteItem(id).then(function() {
                    self.editing.remove = false;
                    var itemToRemove = self.model.get('items').where({
                        id: removeWishId
                    });
                    if (itemToRemove) {
                        self.model.get('items').remove(itemToRemove);
                        self.render();
                    }
                });
            }
        }
    });


    var OrderHistoryView = Backbone.MozuView.extend({
        templateName: "modules/my-account/order-history-list",
        getRenderContext: function() {
            var context = Backbone.MozuView.prototype.getRenderContext.apply(this, arguments);
            context.returning = this.returning;
            if (!this.returning) {
                context.returning = [];
            }
            context.returningPackage = this.returningPackage;
            return context;
        },
        render: function() {
            var self = this;
            Backbone.MozuView.prototype.render.apply(this, arguments);

            $.each(this.$el.find('[data-mz-order-history-listing]'), function(index, val) {

                var orderId = $(this).data('mzOrderId');
                var myOrder = self.model.get('items').get(orderId);
                var orderHistoryListingView = new OrderHistoryListingView({
                    el: $(this).find('.listing'),
                    model: myOrder,
                    messagesEl: $(this).find('[data-order-message-bar]')
                });
                orderHistoryListingView.render();
            });
        },
        selectReturnItems: function() {
            if (typeof this.returning == 'object') {
                $.each(this.returning, function(index, value) {
                    $('[data-mz-start-return="' + value + '"]').prop('checked', 'checked');
                });
            }
        },
        addReturnItem: function(itemId) {
            if (typeof this.returning == 'object') {
                this.returning.push(itemId);
                return;
            }
            this.returning = [itemId];
        },
        removeReturnItem: function(itemId) {
            if (typeof this.returning == 'object') {
                if (this.returning.length === 0) {
                    delete this.returning;
                } else {
                    var itemIdx = this.returning.indexOf(itemId);
                    if (itemIdx != -1) {
                        this.returning.splice(itemIdx, 1);
                    }
                }
            }
        }
    });

    var OrderHistoryListingView = Backbone.MozuView.extend({
        templateName: "modules/my-account/order-history-listing",
        initialize: function() {
            this._views = {
                standardView: this,
                returnView: null
            };
        },
        views: function() {
            return this._views;
        },
        getRenderContext: function() {
            var context = Backbone.MozuView.prototype.getRenderContext.apply(this, arguments);
            context.returning = this.returning;
            if (!this.returning) {
                context.returning = [];
            }
            context.returningPackage = this.returningPackage;
            return context;
        },
        render: function() {
            var self = this;
            Backbone.MozuView.prototype.render.apply(this, arguments);

            if (!this._views.returnView) {
                this._views.returnView = new ReturnOrderListingView({
                    el: self.el,
                    model: self.model
                });
                this.views().returnView.on('renderMessage', this.renderMessage, this);
                this.views().returnView.on('returnCancel', this.returnCancel, this);
                this.views().returnView.on('returnSuccess', this.returnSuccess, this);
                this.views().returnView.on('returnFailure', this.returnFailure, this);
            }
        },
        renderMessage: function(message) {
            var self = this;
            if (message) {
                if (message.messageType) {
                    message.autoFade = true;
                    this.model.messages.reset([message]);
                    this.messageView.render();
                }
            }
        },
        returnSuccess: function() {
            this.renderMessage({
                messageType: 'returnSuccess'
            });
            this.render();
        },
        returnFailure: function() {
            this.renderMessage({
                messageType: 'returnFailure'
            });
            this.render();
        },
        returnCancel: function() {
            this.render();
        },
        selectReturnItems: function() {
            if (typeof this.returning == 'object') {
                $.each(this.returning, function(index, value) {
                    $('[data-mz-start-return="' + value + '"]').prop('checked', 'checked');
                });
            }
        },
        addReturnItem: function(itemId) {
            if (typeof this.returning == 'object') {
                this.returning.push(itemId);
                return;
            }
            this.returning = [itemId];
        },
        removeReturnItem: function(itemId) {
            if (typeof this.returning == 'object') {
                if (this.returning.length === 0) {
                    delete this.returning;
                } else {
                    var itemIdx = this.returning.indexOf(itemId);
                    if (itemIdx != -1) {
                        this.returning.splice(itemIdx, 1);
                    }
                }
            }
        },
        startOrderReturn: function(e) {
            this.model.clearReturn();
            this.views().returnView.render();
        }
    });

    var OmxOrderHistoryView = Backbone.MozuView.extend({
        //templateName: "modules/my-account/omx-order-history-list",
        templateName: "modules/my-account/my-account-omx-orderhistory",  
        
        constructor: function() {
            EditableView.apply(this, arguments);
            this.editing.order = false;
            this.invalidFields = {};
        },

        getRenderContext: function() {
            var context = Backbone.MozuView.prototype.getRenderContext.apply(this, arguments);
            return context;
        },
        render: function() {
            var self = this;
           
                Backbone.MozuView.prototype.render.apply(this, arguments);

                $.each(this.$el.find('[data-mz-omx-order-history-listing]'), function(index, val) {
    
                    var orderId = $(this).data('mzOrderId');
                    var myOrder = _.find(self.model.models, function(model) {
                        return model.attributes.orderId == orderId;
                    });
                    var orderHistoryListingView = new OmxOrderHistoryListingView({
                        el: $(this).find('.mz-omx-orderlisting'),
                        model: myOrder,
                        messagesEl: $(this).find('[data-order-message-bar]')
                    });
                    orderHistoryListingView.render();
                });
            if (this.editing.order) {
                this.startViewOMXOrderHistory();
            } else {
                this.cancelViewOMXOrder(); 
            }
        },
        viewOMXOrderHistory: function (event) {
            if(event)
                event.preventDefault();

            this.editing.order = true; 
           /* this.render();  */
            this.startViewOMXOrderHistory(); 
        },

        startViewOMXOrderHistory: function () {
            $('.dz-backtodashboard.mz-back-to-dash').show(); 
            $('.mz-l-stack-section').hide();
            $('.mz-l-stack-section.mz-accountorderhistory').show();
            $('.mz-l-stack-section.mz-accountorderhistory').removeClass('no-editing').addClass('is-editing');
            $('.dl-maintitle').hide();
            $('.mz-scrollnav-item').removeClass('active');
            $('.mz-scrollnav-item.dl-orderhistory').addClass('active');
            $('.mz-accountorderhistory .dl-view-wrapper').addClass('hidden'); 
            $('.mz-accountorderhistory .dl-link-edit.mz-link-edit-order').addClass('hidden'); 
            $('.mz-accountorderhistory .mz-orderhistory-section-wrapper').removeClass('hidden'); 
        },
        cancelViewOMXOrder: function () {
            this.editing.order = false; 
            $('.dz-backtodashboard.mz-back-to-dash').hide(); 
            
            $('.mz-l-stack-section').removeClass('is-editing').addClass('no-editing');
            $('.mz-l-stack-section').show();
            $('.dl-maintitle').show();
            $('.mz-scrollnav-item').removeClass('active');
            $('.mz-scrollnav-item.dl-accountDashboard').addClass('active');
            $('.mz-accountorderhistory .dl-view-wrapper').removeClass('hidden'); 
            $('.mz-accountorderhistory .mz-orderhistory-section-wrapper').addClass('hidden'); 
            $('.mz-accountorderhistory .dl-link-edit.mz-link-edit-order').removeClass('hidden'); 

            /*this.render(); */
        }
        
    });
    var OmxItemSubscriptionView = EditableView.extend({
        templateName: "modules/my-account/my-account-omx-item-subscriptions",  
        autoUpdate: [
            'omxItemSubscriptions.editingOrderItem.frequency'
        ],
        
        constructor: function() {
            EditableView.apply(this, arguments);
            this.editing.subscription = false; 
            this.editing.allSubscription = true; 
            this.editing.nextOrdershipTo  = false; 
            this.editing.nextOrderPayment  = false; 
            this.invalidFields = {};
        },

        render: function() {
            var self = this;
            Backbone.MozuView.prototype.render.apply(this, arguments);

            $('.mz-autoreplanish-item-actions .selectpicker').selectpicker();
        }, 

        viewOMXItemSubscription: function (event) {
            if(event)
                event.preventDefault();
            this.editing.subscription = true; 
            this.editing.allSubscription = true; 
            this.editing.nextOrdershipTo  = false; 
            this.editing.nextOrderPayment  = false; 
            this.editing.orderItem = 'view'; 
            
            this.startViewOMXItemSubscription(); 

            this.render();
            
        },

        startViewOMXItemSubscription: function () {
            $('.dz-backtodashboard.mz-back-to-dash').show(); 
            $('.mz-l-stack-section').hide();
            $('.mz-l-stack-section.mz-accountitemsubscriptions').show();
            $('.mz-l-stack-section.mz-accountitemsubscriptions').removeClass('no-editing').addClass('is-editing');
            $('.dl-maintitle').hide();
            $('.mz-scrollnav-item').removeClass('active');
            $('.mz-scrollnav-item.dl-itemsubscriptions').addClass('active');
            $('.mz-accountitemsubscriptions .dl-view-wrapper').addClass('hidden'); 
            $('.mz-accountitemsubscriptions .dl-link-edit.mz-link-edit-suscription').addClass('hidden'); 
            $('.mz-accountitemsubscriptions .mz-subscription-section-wrapper').removeClass('hidden'); 
        },
        cancelViewOMXItemSubscription: function () {
            this.editing.subscription = false; 
            this.editing.allSubscription = false; 
            $('.dz-backtodashboard.mz-back-to-dash').hide(); 
            
            $('.mz-l-stack-section').removeClass('is-editing').addClass('no-editing');
            $('.mz-l-stack-section').show();
            $('.dl-maintitle').show();
            $('.mz-scrollnav-item').removeClass('active');
            $('.mz-scrollnav-item.dl-accountDashboard').addClass('active');
            $('.mz-accountitemsubscriptions .dl-view-wrapper').removeClass('hidden'); 
            $('.mz-accountitemsubscriptions .mz-subscription-section-wrapper').addClass('hidden'); 
            $('.mz-accountitemsubscriptions .dl-link-edit.mz-link-edit-subscription').removeClass('hidden'); 
            this.render(); 
        }, 
        editOMXItemSubscriptionPayment: function () {
            this.editing.nextOrdershipTo = false; 
            this.editing.nextOrderPayment = true; 
            this.editing.allSubscription = false; 

            var paymentMethod = this.model.get('omxItemSubscriptions.nextOrder').paymentInfo; 
            this.editing.sameAsNextOrder = this.getCardSameId(paymentMethod); 
            this.render(); 
        }, 
        finishEditNextOrderPayment: function () {
            var selectedPayId = $("input[name*='nextOrderPayment']:checked").data('mzAutoreplanishId'), 
                card = this.model.get('cards').findWhere({
                    id: selectedPayId
                }), 
                membershipId = this.model.get('omxItemSubscriptions').get('nextOrder').membershipId;

            if (card) {
                this.model.get('omxItemSubscriptions').updateNextOrderShipTo(card,membershipId).done(function(data){
                    console.log('update success : ', data); 
                    this.editing.nextOrderPayment = false; 
                    this.render(); 
                }).fail(function(err){
                    console.log('update error : ', err); 
                }); 
            } else {
                this.editing.nextOrderPayment = false; 
                this.render(); 
            }
        }, 
        cancelEditNextOrderPayment: function () {
            this.editing.nextOrderPayment = false; 
            this.render(); 
        }, 
        getContactSameId: function(shipTothis) {
            
            var conctacts = this.model.get('contacts'); 
            var contactOnAccount = conctacts.toJSON().find(function(c){
                return( c.firstName ==  shipTothis.firstName && c.lastNameOrSurname == shipTothis.lastNameOrSurname && c.address.address1.toLowerCase() == shipTothis.address.address1.toLowerCase()  && c.address.address2.toLowerCase() == shipTothis.address.address2.toLowerCase()  && c.address.cityOrTown.toLowerCase() == shipTothis.address.cityOrTown.toLowerCase() && c.address.countryCode.toLowerCase() == shipTothis.address.countryCode.toLowerCase() && c.address.postalOrZipCode.toLowerCase() == shipTothis.address.postalOrZipCode.toLowerCase() && c.address.stateOrProvince.toLowerCase() == shipTothis.address.stateOrProvince.toLowerCase()); 
            });

            console.log('contactOnAccount --> ', contactOnAccount); 
            if (contactOnAccount) {
                return contactOnAccount.id; 
            }
            return ''; 
        },
        getCardSameId: function(thisPayment) {

            var cards = this.model.get('cards'); 
            var cardOnAccount = cards.toJSON().find(function(c){
                return( c.cardNumberPart.split("*").join('') ==  thisPayment.cardNumberPart.split("*").join('') && c.cardType.toLowerCase() == thisPayment.cardType.toLowerCase() && c.expireMonth == thisPayment.expireMonth && c.expireYear == thisPayment.expireYear  ); 
            });

            console.log('cardOnAccount --> ', cardOnAccount); 
            if (cardOnAccount) {
                return cardOnAccount.id; 
            }
            return ''; 
        },

        editOMXItemSubscriptionShipTo: function () {
            this.editing.nextOrdershipTo = true; 
            this.editing.nextOrderPayment = false; 

            this.editing.allSubscription = false; 
            var shipTothis= this.model.get('omxItemSubscriptions.nextOrder').shippingInfo; 

            this.editing.sameAsNextOrder = this.getContactSameId(shipTothis); 
            this.render(); 
        }, 
        finishEditNextOrderShipTo: function () {
            var selectedShipId = $("input[name*='shipToAddress']:checked").data('mzAutoreplanishId'), 
                contact = this.model.get('contacts').findWhere({
                    id: selectedShipId
                }), 
                membershipId = this.model.get('omxItemSubscriptions').get('nextOrder').membershipId;

            if (contact) {
           
                this.model.get('omxItemSubscriptions').updateNextOrderShipTo(contact,membershipId).done(function(data){
                    console.log('update success : ', data); 
                    this.editing.nextOrdershipTo = false; 
                    this.render(); 
                }).fail(function(err){
                    console.log('update error : ', err); 
                }); 
            } else {
                this.editing.nextOrdershipTo = false; 
                this.render(); 
            }
        }, 
        cancelEditNextOrderShipTo: function () {
            this.editing.nextOrdershipTo = false; 
            this.render(); 
        }, 

        manageItem: function (event) {

            this.editing.allSubscription = true;
            var membershipId = this.editing.orderItem = $(event.currentTarget).data('mzItem');
            this.model.get('omxItemSubscriptions').beginEditOrderItem(membershipId);
            this.render();
        },
        cancelEditAuotreplanishItem : function (event) {
            this.editing.allSubscription = true;
            this.editing.orderItem = "view";
            this.model.get('omxItemSubscriptions').endEditOrderItem();
            this.render();
        }, 
        finishEditAuotreplanishItem : function(event) {
            this.editing.allSubscription = true;
            var me = this, 
                membershipId = $(event.currentTarget).data('mzMembershipId'), 
                frequency = $('#mz_autoship_frequency_'+membershipId).find(":selected").val(),
                actionType = $('#mz_autoship_action_'+membershipId).find(":selected").val(),
                orderNumber = $(event.currentTarget).data('mzOrderNumber'), 
                lineItem = $(event.currentTarget).data('mzLineNumber'),
                params = {
                    frequency : frequency, 
                    actionType : actionType
                };
            
                if ('mz-autoreplanish-action-type-update-frequency' == actionType) {
                this.model.get('omxItemSubscriptions').updateLineItemFrequency(params).done(function(data){
                    console.log('update success : ', data); 
                    me.editing.subscription = true; 
                    me.editing.allSubscription = true; 
                    me.editing.nextOrdershipTo  = false; 
                    me.editing.nextOrderPayment  = false; 
                    me.editing.orderItem = 'view'; 
                    me.render();             
                }).fail(function(err){
                    console.log('update error : ', err); 
                }); 

            } else {
                this.model.get('omxItemSubscriptions').orderWaitDateUpdate(params).done(function(data){
                    console.log('update success : ', data); 
                    me.editing.subscription = true; 
                    me.editing.allSubscription = true; 
                    me.editing.nextOrdershipTo  = false; 
                    me.editing.nextOrderPayment  = false; 
                    me.editing.orderItem = 'view'; 
                    me.render();             
                }).fail(function(err){
                    console.log('update error : ', err); 
                }); 
            }
        }
        
    }); 


    var OmxOrderHistoryListingView = Backbone.MozuView.extend({
        templateName: "modules/my-account/omx-order-history-listing",
        additionalEvents: {
          'click a.mz-order-code' : 'getOrderDetail'
        },
        initialize: function() {
            this._views = {
                standardView: this,
                returnView: null
            };
        },
        getOrderDetail: function(event) {
          var orderCode = $(event.currentTarget).data('mzOrderCode');

         // api...$.
          if (!require.mozuData('pagecontext').isEditMode) {
              window.location.href = (HyprLiveContext.locals.siteContext.siteSubdirectory || '') + '/order-status-detail?order='+orderCode;
          }
        },
        views: function() {
            return this._views;
        },
        getRenderContext: function() {
            var context = Backbone.MozuView.prototype.getRenderContext.apply(this, arguments);
            return context;
        },
        render: function() {
            var self = this;
            //self.updateCircleCommerceOrderItemAttributes();
            Backbone.MozuView.prototype.render.apply(this, arguments);
          }
      });

    var ReturnOrderListingView = Backbone.MozuView.extend({
        templateName: "modules/my-account/order-history-listing-return",
        getRenderContext: function() {
            var context = Backbone.MozuView.prototype.getRenderContext.apply(this, arguments);
            var order = this.model;
            if (order) {
                this.order = order;
                context.order = order.toJSON();
            }
            return context;
        },
        render: function() {
            var self = this;
            var returnItemViews = [];

            self.model.fetchReturnableItems().then(function(data) {
                var returnableItems = self.model.returnableItems(data.items);
                if (self.model.getReturnableItems().length < 1) {
                    self.trigger('renderMessage', {
                        messageType: 'noReturnableItems'
                    });
                    //self.$el.find('[data-mz-message-for="noReturnableItems"]').show().text(Hypr.getLabel('noReturnableItems')).fadeOut(6000);
                    return false;
                }
                Backbone.MozuView.prototype.render.apply(self, arguments);

                $.each(self.$el.find('[data-mz-order-history-listing-return-item]'), function(index, val) {
                    var packageItem = returnableItems.find(function(model) {
                        if($(val).data('mzOrderLineId') == model.get('orderLineId')){
                            if ($(val).data('mzOptionAttributeFqn')) {
                                return (model.get('orderItemOptionAttributeFQN') == $(val).data('mzOptionAttributeFqn') && model.uniqueProductCode() == $(val).data('mzProductCode'));
                            }
                            return (model.uniqueProductCode() == $(val).data('mzProductCode'));
                        }
                        return false;
                    });

                    returnItemViews.push(new ReturnOrderItemView({
                        el: this,
                        model: packageItem
                    }));
                });

                _.invoke(returnItemViews, 'render');

            });

        },
        clearOrderReturn: function() {
            this.$el.find('[data-mz-value="isSelectedForReturn"]:checked').click();
        },
        cancelOrderReturn: function() {
            this.clearOrderReturn();
            this.trigger('returnCancel');
        },
        finishOrderReturn: function() {
            var self = this,
                op = this.model.finishReturn();
            if (op) {
                return op.then(function(data) {
                    self.model.isLoading(false);
                    self.clearOrderReturn();
                    self.trigger('returnSuccess');
                }, function() {
                    self.model.isLoading(false);
                    self.clearOrderReturn();
                    this.trigger('returnFailure');
                });
            }
        }
    });

    var ReturnOrderItemView = Backbone.MozuView.extend({
        templateName: "modules/my-account/order-history-listing-return-item",
        autoUpdate: [
            'isSelectedForReturn',
            'rmaReturnType',
            'rmaReason',
            'rmaQuantity',
            'rmaComments'
        ],
        dataTypes: {
            'isSelectedForReturn': Backbone.MozuModel.DataTypes.Boolean
        },
        startReturnItem: function(e) {
            var $target = $(e.currentTarget);

            if (this.model.uniqueProductCode()) {
                if (!e.currentTarget.checked) {
                    this.model.set('isSelectedForReturn', false);
                    //var itemDetails = packageItem.getItemDetails();
                    this.model.cancelReturn();
                    this.render();

                    return;
                }

                this.model.set('isSelectedForReturn', true);
                this.model.startReturn();
                this.render();
            }
        },
        render: function() {
            Backbone.MozuView.prototype.render.apply(this, arguments);
        }
    });

    var ReturnHistoryView = Backbone.MozuView.extend({
        templateName: "modules/my-account/return-history-list",
        initialize: function() {
            var self = this;
            this.listenTo(this.model, "change:pageSize", _.bind(this.model.changePageSize, this.model));
            this.listenTo(this.model, 'returndisplayed', function(id) {
                var $retView = self.$('[data-mz-id="' + id + '"]');
                if ($retView.length === 0) $retView = self.$el;
                $retView.ScrollTo({
                    axis: 'y'
                });
            });
        },
        startReturn: function(event) {
            if(event)
                event.preventDefault();
            $('.mz-l-stack-section').hide();
            $('.mz-l-stack-section.mz-accountreturnhistory').show();
            $('.mz-l-stack-section.mz-accountreturnhistory').removeClass('no-editing').addClass('is-editing');
            $('.dl-maintitle').hide();
            $('.mz-scrollnav-item').removeClass('active');
            $('.mz-scrollnav-item.dl-returns').addClass('active');
            this.render();
        },
        printReturnLabel: function(e) {
            var self = this,
                $target = $(e.currentTarget);

            //Get Whatever Info we need to our shipping label
            var returnId = $target.data('mzReturnid'),
                returnObj = self.model.get('items').findWhere({
                    id: returnId
                });

            var printReturnLabelView = new PrintView({
                model: returnObj
            });

            var _totalRequestCompleted = 0;

            _.each(returnObj.get('packages'), function(value, key, list) {
                window.accountModel.apiGetReturnLabel({
                    'returnId': returnId,
                    'packageId': value.id,
                    'returnAsBase64Png': true
                }).then(function(data) {
                    value.labelImageSrc = 'data:image/png;base64,' + data;
                    _totalRequestCompleted++;
                    if (_totalRequestCompleted == list.length) {
                        printReturnLabelView.render();
                        printReturnLabelView.loadPrintWindow();
                    }
                });
            });

        }
    });

    var PrintView = Backbone.MozuView.extend({
        templateName: "modules/my-account/my-account-print-window",
        el: $('#mz-printReturnLabelView'),
        initialize: function() {},
        loadPrintWindow: function() {
            var host = HyprLiveContext.locals.siteContext.cdnPrefix,
                printScript = host + "/scripts/modules/print-window.js",
                printStyles = host + "/stylesheets/modules/my-account/print-window.css";

            var my_window,
                self = this,
                width = window.screen.width - (window.screen.width / 2),
                height = window.screen.height - (window.screen.height / 2),
                offsetTop = 200,
                offset = window.screen.width * 0.25;


            my_window = window.open("", 'mywindow' + Math.random() + ' ', 'width=' + width + ',height=' + height + ',top=' + offsetTop + ',left=' + offset + ',status=1');
            my_window.document.write('<html><head>');
            my_window.document.write('<link rel="stylesheet" href="' + printStyles + '" type="text/css">');
            my_window.document.write('</head>');

            my_window.document.write('<body>');
            my_window.document.write($('#mz-printReturnLabelView').html());

            my_window.document.write('<script src="' + printScript + '"></script>');

            my_window.document.write('</body></html>');
        }
    });

    var PaymentMethodsView = EditableView.extend({
        templateName: "modules/my-account/my-account-paymentmethods",
        autoUpdate: [
            'editingCard.isDefaultPayMethod',
            'editingCard.paymentOrCardType',
            'editingCard.nameOnCard',
            'editingCard.cardNumberPartOrMask',
            'editingCard.expireMonth',
            'editingCard.expireYear',
            'editingCard.cvv',
            'editingCard.isCvvOptional',
            'editingCard.contactId',
            'editingContact.firstName',
            'editingContact.lastNameOrSurname',
            'editingContact.address.address1',
            'editingContact.address.address2',
            'editingContact.address.address3',
            'editingContact.address.cityOrTown',
            'editingContact.address.countryCode',
            'editingContact.address.stateOrProvince',
            'editingContact.address.postalOrZipCode',
            'editingContact.address.addressType',
            'editingContact.phoneNumbers.home',
            'editingContact.isBillingContact',
            'editingContact.isPrimaryBillingContact',
            'editingContact.isShippingContact',
            'editingContact.isPrimaryShippingContact'
        ],
        renderOnChange: [
            'editingCard.isDefaultPayMethod',
            'editingCard.contactId',
            'editingContact.address.countryCode'
        ],
        additionalEvents: {
            "blur #mz-payment-credit-card-number": "changeCardType",
            "input  [name='security-code'],[name='credit-card-number']": "allowDigit"
        },
        render: function() {
            var self = this;
            Backbone.MozuView.prototype.render.apply(this, arguments);

            $('#account-panels .selectpicker').selectpicker();
            $('.mz-l-stack-section.mz-accountpaymentmethods').removeClass('is-form').addClass('no-form');
        },
        allowDigit:function(e){
            e.target.value= e.target.value.replace(/[^\d]/g,'');
        },
        changeCardType:function(e){
            window.checkoutModel = this.model;
            var number = e.target.value;
            var cardType='';

            // visa
            var re = new RegExp("^4");
            if (number.match(re) !== null){
                cardType = "VISA";
            }

            // Mastercard
            // Updated for Mastercard 2017 BINs expansion
             if (/^(5[1-5][0-9]{14}|2(22[1-9][0-9]{12}|2[3-9][0-9]{13}|[3-6][0-9]{14}|7[0-1][0-9]{13}|720[0-9]{12}))$/.test(number))
                cardType = "MC";

            // AMEX
            re = new RegExp("^3[47]");
            if (number.match(re) !== null)
                cardType = "AMEX";

            // Discover
            re = new RegExp("^(6011|622(12[6-9]|1[3-9][0-9]|[2-8][0-9]{2}|9[0-1][0-9]|92[0-5]|64[4-9])|65)");
            if (number.match(re) !== null)
                cardType = "DISCOVER";

            $('.mz-card-type-images').find('span').removeClass('active');
            if(cardType){
                this.model.set('editingCard.paymentOrCardType',cardType);
                $('.mz-card-type-images').find('span[data-mz-card-type-image="'+cardType+'"]').addClass('active');
            }
            else{
                this.model.set('editingCard.paymentOrCardType',null);
            }

        },
        viewPayments: function () {
            this.editing.card = "view";
            this.startEditPayments();
            this.render();
        },
        startEditPayments: function () {
            $('.mz-l-stack-section').hide();
            $('.mz-l-stack-section.mz-accountpaymentmethods').show();
            $('.mz-l-stack-section.mz-accountpaymentmethods').removeClass('no-editing').addClass('is-editing');
            $('.dl-maintitle').hide();
            $('.mz-scrollnav-item').removeClass('active');
            $('.mz-scrollnav-item.dl-paymentmethods').addClass('active');
        },
        beginEditCard: function (e) {
            this.startEditPayments();
            var id = this.editing.card = e.currentTarget.getAttribute('data-mz-card');
            this.model.beginEditCard(id);
            this.render();
            $("input[name='credit-card-number']").focus();
            $('.mz-l-stack-section.mz-accountpaymentmethods').removeClass('no-form').addClass('is-form');
        },
        finishEditCard: function() {
            var self = this;
            if (!self.model.get('editingCard.paymentOrCardType') &&  $("input[name='credit-card-number']")[0].value && $("input[name='credit-card-type']")[0].value ) {
                self.model.set('editingCard.paymentOrCardType', $("input[name='credit-card-type']")[0].value); 
            }
            var operation = this.doModelAction('saveCard');
            if (operation) {
                operation.then(function(){
                    self.model.messages.reset();
                });
                operation.otherwise(function() {
                    self.editing.card = true;
                });
                this.editing.card = "view";
            }
            $('.mz-l-stack-section.mz-accountpaymentmethods').removeClass('is-form').addClass('no-form');
        },
        makePrimary: function (e) {
            var id = e.currentTarget.getAttribute('data-mz-payment-id');
            this.model.makePrimary(id);
            location.reload();
        },        
        cancelEditCard: function () {
            this.editing.card = "view";
            this.model.endEditCard();
            this.render();
            $('.mz-l-stack-section.mz-accountpaymentmethods').removeClass('is-form').addClass('no-form');
        },
        cancelViewCard: function () {
            this.editing.card = false;
            this.render();

            $('.mz-l-stack-section').removeClass('is-editing').addClass('no-editing');
            $('.mz-l-stack-section').show();
            $('.dl-maintitle').show();
            $('.mz-scrollnav-item').removeClass('active');
            $('.mz-scrollnav-item.dl-accountDashboard').addClass('active');
        },
        beginDeleteCard: function (e) {
            var self = this,
                id = e.currentTarget.getAttribute('data-mz-card'),
                card = this.model.get('cards').get(id);
            if (window.confirm(Hypr.getLabel('confirmDeleteCard', card.get('cardNumberPart')))) {
                this.doModelAction('deleteCard', id);
            }
        }
    });

    var AddressBookView = EditableView.extend({
        templateName: "modules/my-account/my-account-addressbook",
        autoUpdate: [
            'editingContact.firstName',
            'editingContact.lastNameOrSurname',
            'editingContact.address.address1',
            'editingContact.address.address2',
            'editingContact.address.address3',
            'editingContact.address.cityOrTown',
            'editingContact.address.countryCode',
            'editingContact.address.stateOrProvince',
            'editingContact.address.postalOrZipCode',
            'editingContact.address.addressType',
            'editingContact.phoneNumbers.home',
            'editingContact.isBillingContact',
            'editingContact.isPrimaryBillingContact',
            'editingContact.isShippingContact',
            'editingContact.isPrimaryShippingContact'
            ],
        renderOnChange: [
            'editingContact.address.countryCode',
            'editingContact.address.candidateValidatedAddresses',
            'editingContact.isBillingContact',
            'editingContact.isShippingContact'
        ],
        render: function() {
            var self = this;
            Backbone.MozuView.prototype.render.apply(this, arguments);

            $('#account-panels .selectpicker').selectpicker();
        },
        choose: function (e) {
            var self = this;
            var idx = parseInt($(e.currentTarget).val(), 10);
            var addr = self.model.get('editingContact.address');
            if (idx !== -1) {
                var valAddr = addr.get('candidateValidatedAddresses')[idx];
                for (var k in valAddr) {
                    addr.set(k, valAddr[k]);
                }
            }
            addr.set('candidateValidatedAddresses',null);
            addr.set('isValidated', true);
            this.render();
        },
        viewAddressBook: function () {
            this.editing.contact = "view";
            this.startEditAddressBook();
            this.render();
        },
        startEditAddressBook: function () {
            $('.mz-l-stack-section').hide();
            $('.mz-l-stack-section.mz-accountaddressbook').show();
            $('.mz-l-stack-section.mz-accountaddressbook').removeClass('no-editing').addClass('is-editing');
            $('.dl-maintitle').hide();
            $('.mz-scrollnav-item').removeClass('active');
            $('.mz-scrollnav-item.dl-addressbook').addClass('active');
        },
        beginAddContact: function () {
            this.startEditAddressBook();
            this.editing.contact = false;
            this.model.endEditContact();

            this.model.set('editingContact.isShippingContact', true);

            this.editing.contact = "new";
            this.render();
            $("input[name='firstname']").focus();
        },
        beginEditContact: function (e) {
            this.startEditAddressBook();
            var id = this.editing.contact = e.currentTarget.getAttribute('data-mz-contact');
            this.model.beginEditContact(id);
            this.render();
        },
        finishEditContact: function () {
            
            var self = this,
                isAddressValidationEnabled = HyprLiveContext.locals.siteContext.generalSettings.isAddressValidationEnabled;

                var operation = this.doModelAction('saveContact', { forceIsValid: isAddressValidationEnabled, editingView: self }); // hack in advance of doing real validation in the myaccount page, tells the model to add isValidated: true
            if (operation) {
                blockUiLoader.unblockUi();
                operation.otherwise(function() {
                    self.editing.contact = true;
                });
                this.editing.contact = "view";
            }
        },
        cancelEditContact: function () {
            this.editing.contact = "view";
            this.model.endEditContact();
            this.render();
        },
        cancelViewContact: function () {
            this.editing.contact = false;
            this.render();

            $('.mz-l-stack-section').removeClass('is-editing').addClass('no-editing');
            $('.mz-l-stack-section').show();
            $('.dl-maintitle').show();
            $('.mz-scrollnav-item').removeClass('active');
            $('.mz-scrollnav-item.dl-accountDashboard').addClass('active');

        },
        beginDeleteContact: function (e) {
            var self = this,
                contact = this.model.get('contacts').get(e.currentTarget.getAttribute('data-mz-contact')),
                associatedCards = this.model.get('cards').where({ contactId: contact.id }),
                windowMessage = Hypr.getLabel('confirmDeleteContact', contact.get('address').get('address1')),
                doDeleteContact = function() {
                    return self.doModelAction('deleteContact', contact.id);
                },
                go = doDeleteContact;


            if (associatedCards.length > 0) {
                windowMessage += ' ' + Hypr.getLabel('confirmDeleteContact2');
                go = function() {
                    return self.doModelAction('deleteMultipleCards', _.pluck(associatedCards, 'id')).then(doDeleteContact);
                };

            }

            if (window.confirm(windowMessage)) {
                return go();
            }
        }
    });

    var StoreCreditView = Backbone.MozuView.extend({
        templateName: 'modules/my-account/my-account-storecredit',
        addStoreCredit: function(e) {
            var self = this;
            var id = this.$('[data-mz-entering-credit]').val();
            if (id) return this.model.addStoreCredit(id).then(function() {
                return self.model.getStoreCredits();
            });
        }
    });

function getQueryVariable(variable)
{
       var query = window.location.search.substring(1);
       var vars = query.split("&");
       for (var i=0;i<vars.length;i++) {
               var pair = vars[i].split("=");
               if(pair[0] == variable){return pair[1];}
       }
       return(false);
}

    $(document).ready(function() {

        var accountModel = window.accountModel = CustomerModels.EditableCustomer.fromCurrent();

        $('#account-panels .selectpicker').selectpicker();
        $('.mz-autoreplanish-item-actions .selectpicker').selectpicker();
       

        var $accountSettingsEl = $('#account-settings'),
            $passwordEl = $('#password-section'),
            $orderHistoryEl = $('#account-orderhistory'),
            $omxOrderHistoryEl = $('#account-omx-orderhistory'),
            $omxItemSusbcriptionsEl = $('#account-omx-item-subscriptions'),
            $returnHistoryEl = $('#account-returnhistory'),
            $paymentMethodsEl = $('#account-paymentmethods'),
            $addressBookEl = $('#account-addressbook'),
            $wishListEl = $('#account-wishlist'),
            $messagesEl = $('#account-messages'),
            $storeCreditEl = $('#account-storecredit'),
            orderHistory = accountModel.get('orderHistory'),
            returnHistory = accountModel.get('returnHistory'),
            omxOrderHistoryModel = accountModel.get('omxOrderHistory'),
            omxItemSubscriptionsModel = accountModel.get('omxItemSubscriptions');
            
            //$parentEl = $('.mz-myaccount .mz-l-container');
        var accountViews = window.accountViews = {
            /*
            parent: new ParentView({
                el: $parentEl,
                model: accountModel,
                messagesEl: $messagesEl
            }),*/
            settings: new AccountSettingsView({
                el: $accountSettingsEl,
                model: accountModel,
                messagesEl: $messagesEl
            }),
            password: new PasswordView({
                el: $passwordEl,
                model: accountModel,
                messagesEl: $messagesEl
            }),
            omxOrderHistory: new OmxOrderHistoryView({
              el: $omxOrderHistoryEl, //.find('[data-mz-omx-orderlist]'),
              model: omxOrderHistoryModel
            }),
            omxItemSubscriptions: new OmxItemSubscriptionView({
                el: $omxItemSusbcriptionsEl, //.find('[data-mz-omx-orderlist]'),
                //model: omxItemSubscriptionsModel
                model: accountModel
            }),  
             /*orderHistory: new OrderHistoryView({
                el: $orderHistoryEl.find('[data-mz-orderlist]'),
                model: orderHistory
            }),
            orderHistoryPagingControls: new PagingViews.PagingControls({
                templateName: 'modules/my-account/order-history-paging-controls',
                el: $orderHistoryEl.find('[data-mz-pagingcontrols]'),
                model: orderHistory
            }),
            orderHistoryPageNumbers: new PagingViews.PageNumbers({
                el: $orderHistoryEl.find('[data-mz-pagenumbers]'),
                model: orderHistory
            }),*/
            returnHistory: new ReturnHistoryView({
                el: $returnHistoryEl.find('[data-mz-orderlist]'),
                model: returnHistory
            }),
            returnHistoryPagingControls: new PagingViews.PagingControls({
                templateName: 'modules/my-account/order-history-paging-controls',
                el: $returnHistoryEl.find('[data-mz-pagingcontrols]'),
                model: returnHistory
            }),
            returnHistoryPageNumbers: new PagingViews.PageNumbers({
                el: $returnHistoryEl.find('[data-mz-pagenumbers]'),
                model: returnHistory
            }),
            paymentMethods: new PaymentMethodsView({
                el: $paymentMethodsEl,
                model: accountModel,
                messagesEl: $messagesEl
            }),
            addressBook: new AddressBookView({
                el: $addressBookEl,
                model: accountModel,
                messagesEl: $messagesEl
            }),
            storeCredit: new StoreCreditView({
                el: $storeCreditEl,
                model: accountModel,
                messagesEl: $messagesEl
            })
        };


        if (HyprLiveContext.locals.siteContext.generalSettings.isWishlistCreationEnabled) accountViews.wishList = new WishListView({
            el: $wishListEl,
            model: accountModel.get('wishlist'),
            messagesEl: $messagesEl
        });

        $('.mz-myaccount-nav .dl-accountDashboard').on('click', function (e) {
            e.preventDefault();
            $('.mz-scrollnav-item').removeClass('active');
            $(this).addClass('active');
            accountViews.settings.cancelEdit();
            accountViews.addressBook.cancelViewContact();
            accountViews.paymentMethods.cancelViewCard();
            accountViews.wishList.cancelEditWishlist();
            accountViews.omxItemSubscriptions.cancelViewOMXItemSubscription(); 
            accountViews.omxOrderHistory.cancelViewOMXOrder();
            
        });
        $('.mz-myaccount-nav .dl-personalInfo').on('click', function (e) {
            e.preventDefault();
            accountViews.settings.cancelEdit();
            accountViews.addressBook.cancelViewContact();
            accountViews.paymentMethods.cancelViewCard();
            accountViews.wishList.cancelEditWishlist();
            accountViews.omxOrderHistory.cancelViewOMXOrder();
            accountViews.omxItemSubscriptions.cancelViewOMXItemSubscription(); 
            accountViews.settings.startEdit(e);});
        $('.mz-myaccount-nav .dl-addressbook').on('click', function (e) {
            e.preventDefault();
            accountViews.settings.cancelEdit();
            accountViews.addressBook.cancelViewContact();
            accountViews.paymentMethods.cancelViewCard();
            accountViews.wishList.cancelEditWishlist();
            accountViews.omxOrderHistory.cancelViewOMXOrder();
            accountViews.omxItemSubscriptions.cancelViewOMXItemSubscription(); 
            accountViews.addressBook.viewAddressBook(e);});
        $('.mz-myaccount-nav .dl-paymentmethods').on('click', function (e) {
            e.preventDefault();
            accountViews.settings.cancelEdit();
            accountViews.addressBook.cancelViewContact();
            accountViews.paymentMethods.cancelViewCard();
            accountViews.wishList.cancelEditWishlist();
            accountViews.omxOrderHistory.cancelViewOMXOrder();
            accountViews.omxItemSubscriptions.cancelViewOMXItemSubscription(); 
            accountViews.paymentMethods.viewPayments(e);});
        $('.mz-myaccount-nav .dl-itemsubscriptions').on('click', function (e) {
            e.preventDefault();
            accountViews.settings.cancelEdit();
            accountViews.addressBook.cancelViewContact();
            accountViews.paymentMethods.cancelViewCard();
            accountViews.wishList.cancelEditWishlist();
            accountViews.omxOrderHistory.cancelViewOMXOrder();
            accountViews.omxItemSubscriptions.viewOMXItemSubscription(e); 

        });
        $('.mz-myaccount-nav .dl-orderhistory').on('click', function (e) {
            e.preventDefault();
            accountViews.settings.cancelEdit();
            accountViews.addressBook.cancelViewContact();
            accountViews.paymentMethods.cancelViewCard();
            accountViews.wishList.cancelEditWishlist();
            accountViews.omxItemSubscriptions.cancelViewOMXItemSubscription(); 
            accountViews.omxOrderHistory.viewOMXOrderHistory(e);
        });
        $('.mz-myaccount-nav .dl-accountwishlist').on('click', function (e) {
            e.preventDefault();
            accountViews.settings.cancelEdit();
            accountViews.addressBook.cancelViewContact();
            accountViews.paymentMethods.cancelViewCard();
            accountViews.wishList.cancelEditWishlist();
            accountViews.omxOrderHistory.cancelViewOMXOrder();
            accountViews.omxItemSubscriptions.cancelViewOMXItemSubscription(); 
            accountViews.wishList.startEditWishlist(e);
        });
        $('.mz-myaccount-nav .dl-returns').on('click', function (e) {
            e.preventDefault();
            accountViews.settings.cancelEdit();
            accountViews.addressBook.cancelViewContact();
            accountViews.paymentMethods.cancelViewCard();
            accountViews.wishList.cancelEditWishlist();
            accountViews.omxOrderHistory.cancelViewOMXOrder();
            accountViews.wishList.cancelEditWishlist();
            accountViews.returnHistory.startReturn(e);
        });

/*
        var productIds = []; 

        accountViews.omxItemSubscriptions.model.attributes.items.forEach( function(subscriptionItem) {
            productIds.push(subscriptionItem.attributes.itemCode); 
        }); 
        
        getMozuProducts(productIds).then(function (products) {
            accountViews.omxItemSubscriptions.model.attributes.items.forEach( function(lineItem) {
                var apiProduct = ''; 
                if (lineItem.attributes.itemCode != 'MLCOUPON') {
                    products.forEach( function(pInApi) {
                        if (lineItem.attributes.itemCode === pInApi.productCode ){
                            apiProduct = pInApi; 
                        }
                    });
                    if (apiProduct) {
                        lineItem.attributes.url = "/"+apiProduct.content.seoFriendlyUrl+"/p/"+apiProduct.productCode; 
                        lineItem.attributes.image = apiProduct.content.productImages[0].imageUrl; 
                        
                    }
                }
            });
            accountViews.omxItemSubscriptions.model.attributes.nextOrder.items.forEach( function(lineItem) {
                var apiProduct = ''; 
                if (lineItem.attributes.itemCode != 'MLCOUPON') {
                    products.forEach( function(pInApi) {
                        if (lineItem.attributes.itemCode === pInApi.productCode ){
                            apiProduct = pInApi; 
                        }
                    });
                    if (apiProduct) {
                        lineItem.attributes.url = "/"+apiProduct.content.seoFriendlyUrl+"/p/"+apiProduct.productCode; 
                        lineItem.attributes.image = apiProduct.content.productImages[0].imageUrl; 
                        
                    }
                }
            });  
        });
*/

        // TODO: upgrade server-side models enough that there's no delta between server output and this render,
        // thus making an up-front render unnecessary.
        _.invoke(window.accountViews, 'render');

        var urlParams = getQueryVariable("sec");
        if(urlParams.length){
            switch(urlParams) {
                case "accountdashboard":
                    accountViews.settings.cancelEdit();
                    accountViews.addressBook.cancelViewContact();
                    accountViews.paymentMethods.cancelViewCard();
                    accountViews.wishList.cancelEditWishlist();
                    accountViews.omxOrderHistory.cancelViewOMXOrder();
                    break;
                case "accountsettings":
                    accountViews.settings.cancelEdit();
                    accountViews.addressBook.cancelViewContact();
                    accountViews.paymentMethods.cancelViewCard();
                    accountViews.wishList.cancelEditWishlist();
                    accountViews.omxOrderHistory.cancelViewOMXOrder();
                    accountViews.omxItemSubscriptions.cancelViewOMXItemSubscription(); 
                    accountViews.settings.startEdit(null);
                    break;
                case "wishlist":
                    accountViews.settings.cancelEdit();
                    accountViews.addressBook.cancelViewContact();
                    accountViews.paymentMethods.cancelViewCard();
                    accountViews.wishList.cancelEditWishlist();
                    accountViews.omxOrderHistory.cancelViewOMXOrder();
                    accountViews.omxItemSubscriptions.cancelViewOMXItemSubscription(); 
                    accountViews.wishList.startEditWishlist(null);
                    break;
                case "orderhistory":
                    accountViews.settings.cancelEdit();
                    accountViews.addressBook.cancelViewContact();
                    accountViews.paymentMethods.cancelViewCard();
                    accountViews.wishList.cancelEditWishlist();
                    accountViews.omxOrderHistory.cancelViewOMXOrder();
                    accountViews.omxItemSubscriptions.cancelViewOMXItemSubscription(); 
                    accountViews.omxOrderHistory.viewOMXOrderHistory(null);
                    break;
                case "subscription":
                    accountViews.settings.cancelEdit();
                    accountViews.addressBook.cancelViewContact();
                    accountViews.paymentMethods.cancelViewCard();
                    accountViews.wishList.cancelEditWishlist();
                    accountViews.omxOrderHistory.cancelViewOMXOrder();
                    accountViews.omxItemSubscriptions.cancelViewOMXItemSubscription(); 

                    accountViews.omxItemSubscriptions.viewOMXItemSubscription(null); 
                    break;
                case "paymentmethods":
                    accountViews.settings.cancelEdit();
                    accountViews.addressBook.cancelViewContact();
                    accountViews.paymentMethods.cancelViewCard();
                    accountViews.wishList.cancelEditWishlist();
                    accountViews.omxOrderHistory.cancelViewOMXOrder();
                    accountViews.omxItemSubscriptions.cancelViewOMXItemSubscription(); 
                    accountViews.paymentMethods.viewPayments(null);
                    break;
                case "addressbook":
                    accountViews.settings.cancelEdit();
                    accountViews.addressBook.cancelViewContact();
                    accountViews.paymentMethods.cancelViewCard();
                    accountViews.wishList.cancelEditWishlist();
                    accountViews.omxOrderHistory.cancelViewOMXOrder();
                    accountViews.omxItemSubscriptions.cancelViewOMXItemSubscription(); 
                    accountViews.addressBook.viewAddressBook(null);
                    break;
                case "returns":
                    accountViews.settings.cancelEdit();
                    accountViews.addressBook.cancelViewContact();
                    accountViews.paymentMethods.cancelViewCard();
                    accountViews.wishList.cancelEditWishlist();
                    accountViews.omxOrderHistory.cancelViewOMXOrder();
                    accountViews.returnHistory.startReturn(null);
                    break;
                default:
              } 
        }
    });
});
