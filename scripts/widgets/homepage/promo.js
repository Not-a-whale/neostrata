require([
    "modules/jquery-mozu"
], function($) {
    function showRemove(){
        $( ".promoTextAd > i" ).click(function() {
            console.log('click');
            sessionStorage.setItem('promoTextAd', JSON.stringify({
                text: $( "#promoText" ).html(),
                id: $( "#promoId" ).text()
            }));
            $( ".promoTextAd" ).remove();
        });
    }
    $(document).ready(function(){
        
        var promo = JSON.parse(sessionStorage.getItem('promoTextAd'));
        if(promo !== null){
            if(promo.text != $( "#promoText" ).html() || promo.id != $( "#promoId" ).text()){
                $( $( "#promoCss" ).text() ).prepend( '<div class="promoTextAd">' + $( "#promoText" ).html() + ' <i class="glyphicon glyphicon-remove"></i><a class="promoLink" href="'+ $( "#promoUrl" ).text() +'">Terms & Conditions</a></div>' );
                showRemove();
            }
        } else {
            $( $( "#promoCss" ).text() ).prepend( '<div class="promoTextAd">' + $( "#promoText" ).html() + ' <i class="glyphicon glyphicon-remove"></i><a class="promoLink" href="'+ $( "#promoUrl" ).text() +'">Terms & Conditions</a></div>' );
            showRemove();
        }
    });
});