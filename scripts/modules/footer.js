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
		else
		{
			var d = new Date();
			var month = d.toLocaleString("en-us", { month: "long" });
			var text =  month + " " + d.getFullYear();
			$('footer .fineprint .lastUpdated').text(text);
		}

	});

});
