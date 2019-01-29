define(['shim!vendor/typeahead.js/typeahead.bundle[modules/jquery-mozu=jQuery]>jQuery', 'swiper'], function($, Swiper) {
    var swiper = new Swiper('.mz-productimages-thumbs > div', {
        slidesPerView: 1,
        spaceBetween: 0,
        loop: true,
		navigation: {
			nextEl: '.swiper-button-next',
			prevEl: '.swiper-button-prev'
		}
    });
});