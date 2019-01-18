define(['shim!vendor/typeahead.js/typeahead.bundle[modules/jquery-mozu=jQuery]>jQuery', 'swiper'], function($, Swiper) {
    var swiper = new Swiper('#swiper-b-and-f', {
        slidesPerView: 2,
        spaceBetween: 0,
        loop: false,
		navigation: {
			nextEl: '.swiper-button-next',
			prevEl: '.swiper-button-prev'
		},
        pagination: {
            el: '.swiper-pagination',
            clickable: true,
        },
        slidesPerGroup: 2,
        breakpoints: {
            1024: {
                slidesPerView: 2
            },
            992: {
                slidesPerView: 2
            },
            768: {
                slidesPerView: '2'
            },
            640: {
                slidesPerView: '2'
            },
            320: {
                slidesPerView: '2'
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