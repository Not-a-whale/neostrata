define(['hyprlive', 'underscore', 'jQuery', "hyprlivecontext"], function(Hypr, _, $, HyprLiveContext) {
	if (window.metricsEngine === undefined) {
		var metricsEngine = {
			init: function() {
				metricsEngine.googleTagManagerEnabled = Hypr.getThemeSetting('googleTagManagerEnabled');
			},
			getGAProduct: function(itemId, itemName, itemPrice, sku, options, product, cat, qty) {
				try {
					var siteContext = HyprLiveContext.locals.siteContext;
					var brandSite = '';
					var category = '';
					if (cat.content) {
						category = cat.content.name;
					} else if (cat) {
						category = cat;
					}
					var gaProduct = {
						'name': itemName ? itemName : '',
						'id': itemId,
						'sku': sku ? sku : '',
						'price': itemPrice.extendedAmount ? itemPrice.extendedAmount.toString() : itemPrice.toString(),
						'originalPrice': itemPrice.listAmount ? itemPrice.listAmount.toString() : itemPrice.toString(),
						'brand': brandSite,
						'category': category,
						'quantity': qty,
						'variant': _.map(options, function(option) {
							if (option.value) {
								return option.value;
							} else if (option.get('value')) {
								return option.get('value');
							}
						}).join(',')
					};
					return gaProduct;
				} catch (ex) {
					console.log(ex);
					return true;
				}
			},
			trackAddToCart: function(cartItem, categories, isQV, qty) {
				try {
					var product = cartItem.product;
					var category = categories;
					var gaProduct = metricsEngine.getGAProduct(product.productCode, product.name, cartItem.unitPrice, product.variationProductCode, product.options, product, category, qty);
					if (metricsEngine.googleTagManagerEnabled) {
						window.dataLayer.push({
							'event': 'addToCart',
							'depData': {
								'currencyCode': 'USD',
								'add': {
									'actionField': {
										'list': 'Directory: ' + category.content.name
									},
									'products': [
										gaProduct
									]
								}
							}
						});
						return true;
					} else {
						return true;
					}
				} catch (ex) {
					return true;
				}
			},
            trackDirectoryAddToCart: function(product, categories, isQV, qty) {
                try {
                    var price = product.get('price.onSale') ? product.get('price.salePrice') : product.get('price.price');
                    var category = categories;
                    var gaProduct = metricsEngine.getGAProduct(product.get('productCode'), product.get('content.productName'), price, product.get('variationProductCode'), product.get('options'), product, category, qty);
                    if (metricsEngine.googleTagManagerEnabled) {
                        window.dataLayer.push({
                            'event': 'addToCart',
                            'depData': {
                                'currencyCode': 'USD',
                                'add': {
                                    'actionField': {
                                        'list': 'Directory: ' + category.content.name
                                    },
                                    'products': [
                                        gaProduct
                                    ]
                                }
                            }
                        });
                        return true;
                    } else {
                        return true;
                    }
                } catch (ex) {
                    return true;
                }
            },
			trackRemovedFromCart: function(cartItem) {
				try {
					var product = cartItem.get('product');
                    var categories = require.mozuData('categories');
					var category = this.findCategory(categories, product);
					var gaProduct = metricsEngine.getGAProduct(product.get('productCode'), product.get('name'), cartItem.get('unitPrice'), product.get('variationProductCode'), product.get('options').models, product, category, cartItem.get('quantity'));
					if (metricsEngine.googleTagManagerEnabled && cartItem) {
						window.dataLayer.push({
							'event': 'removeFromCart',
							'depData': {
								'remove': {
									'actionField': {
										'list': 'Directory: ' + category.content.name
									},
									'products': [gaProduct]
								}
							}
						});
						return true;
					} else {
						return true;
					}
				} catch (ex) {
					console.log(ex);
					return true;
				}
			},
			findCategory: function(categories, product) {
				return _.find(categories.all, function(category) {
					return category.categoryId == product.attributes.categories[0].id;
				});
			}
		};
		try {
			metricsEngine.init();
		} catch (ex) {
			console.log('Metrics Init Error.');
		}
		window.metricsEngine = metricsEngine;
	}
	return window.metricsEngine;
});
