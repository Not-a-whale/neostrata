require(["modules/jquery-mozu"], function($) {

	$(document).ready(function() {
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
