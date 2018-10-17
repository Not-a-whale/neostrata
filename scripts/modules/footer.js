require(["modules/jquery-mozu"], function($) {

	$(document).ready(function() {
		console.log('Footer ready');
		if ($.cookie("cookies_notice_accepted") === "true") {
			$("#cookies-notice").hide();
		} else {
			$("#cookies-notice").show();
		}
		$("#cookies-notice .close").click(function(){
			$.cookie("cookies_notice_accepted", "true");
			$("#cookies-notice").hide();
		});

	});

});
