define(['shim!vendor/typeahead.js/typeahead.bundle[modules/jquery-mozu=jQuery]>jQuery', 'swiper'], function($, Swiper) {
    $(document).ready(function() {
       console.log('product-carousel-swiper ready');
    });
    var swiper = new Swiper('.swiper-container', {
        slidesPerView: 3,
        spaceBetween: 30,
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
});