define(['shim!vendor/typeahead.js/typeahead.bundle[modules/jquery-mozu=jQuery]>jQuery', 'swiper'], function($, Swiper) {
    var swiper = new Swiper('#clinicalStudySwipe', {
        slidesPerView: 1,
        spaceBetween: 0,
        loop: false,
        pagination: {
            el: '.swiper-pagination',
            clickable: true,
        },
		navigation: {
			nextEl: '.swiper-button-next',
			prevEl: '.swiper-button-prev'
        }
    });
});