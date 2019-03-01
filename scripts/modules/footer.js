require(["modules/jquery-mozu", "hyprlivecontext", "modules/models-product", "modules/api"], function($, HyprLiveContext, ProductModels, api) {

	$(document).ready(function() {
            if(!HyprLiveContext.locals.themeSettings.commerceEnabled){
		if ($.cookie("cookies_notice_accepted") === "true") {
			$("#cookies-notice").hide();
		} else {
			$("#cookies-notice").show();
		}
		$("#cookies-notice .close").click(function(){
			$.cookie("cookies_notice_accepted", "true");
			$("#cookies-notice").hide();
		});
		}
		else
		{
			var d = new Date();
			var month = d.toLocaleString("en-us", { month: "long" });
			var text =  month + " " + d.getFullYear();
			$('footer .fineprint .lastUpdated').text(text);
		}
		// 
		var user = require.mozuData('user');
		if(user.accountId){
			if(sessionStorage.getItem('addToWishlistArr')){
				var tempSavedProdToWish = JSON.parse(sessionStorage.getItem('addToWishlistArr'));
				sessionStorage.removeItem('addToWishlistArr');
				var filter = "";
				for (var i = 0; i < tempSavedProdToWish.length; i++) {
					if (filter !== "") filter += " or ";
                    filter += "productCode eq "+ tempSavedProdToWish[i]; 
				}
				api.get('products', filter).then(function(productResponse){
					for (var index = 0; index < productResponse.length; index++) {
						margeProdToWish(productResponse[index].data);
					}
				});
			}
		}
	});

	function margeProdToWish(pCode){
		setTimeout(function(){
			var product = new ProductModels.Product(pCode);
			product.addToWishlist();
			$('#wishlist-'+pCode.productCode).attr("data-mz-action", "directoryRemoveFromWishlist");
			$('#wishlist-'+pCode.productCode+' span').removeClass("blank-heart").addClass("filled-heart");
		}, 1000);
	}

});
