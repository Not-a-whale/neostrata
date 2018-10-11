define(['shim!vendor/typeahead.js/typeahead.bundle[modules/jquery-mozu=jQuery]>jQuery', 'swiper'], function($, Swiper) {
    var swiper = new Swiper('.swiper-container', {
        slidesPerView: 3,
        spaceBetween: 0,
        loop: true,
		navigation: {
			nextEl: '.swiper-button-next',
			prevEl: '.swiper-button-prev'
		},
        breakpoints: {
            1024: {
                slidesPerView: 3
            },
            992: {
                slidesPerView: 2
            },
            768: {
                slidesPerView: '1'
            },
            640: {
                slidesPerView: '1'
            },
            320: {
                slidesPerView: '1'
            }
        }
    });
    function window_resize(){
        $('.product-listing-container').css('height', '');
        var maxHeight = Math.max.apply(null, $(".product-listing-container").map(function ()
        {
            return $(this).height() + parseFloat($(this).css("padding-top")) + parseFloat($(this).css("padding-bottom"));
        }).get());
        $('.product-listing-container').css('height', maxHeight);
    }
    $(document).ready(function() {
        window_resize();
    });
    $(window).resize(function() {
        window_resize();
    });


});