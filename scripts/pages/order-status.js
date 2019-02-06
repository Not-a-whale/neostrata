require([
    "modules/jquery-mozu"
], function($) {

  $(document).ready(function(event){
    var url = new URL(decodeURIComponent(location.href));
    $('input[name="verification"]').val(url.searchParams.get("zip"));
    $('input[name="ordernum"]').val(url.searchParams.get("orderNumber"));
    });
});
