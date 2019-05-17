define([
    'modules/jquery-mozu',
    "vendor/jquery/owl.carousel.min"], function($, owlCarousel) {
        $(document).ready(function() {
            $('.owl-carousel-widget').owlCarousel({
                items:1,
                margin:10,
                video:true,
                loop: $('.owl-carousel-widget .item-video').length > 1 ? true : false
            });
        });
});