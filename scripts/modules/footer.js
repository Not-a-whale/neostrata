require(["modules/jquery-mozu", "hyprlivecontext"], function($, HyprLiveContext) {

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
	});

});
