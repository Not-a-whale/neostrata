define(['shim!vendor/typeahead.js/typeahead.bundle[modules/jquery-mozu=jQuery]>jQuery', "bxslider"], function($, bxslider) {
      var slider = $('#productpager-Carousel').bxSlider({
          slideWidth: 125,
          minSlides: 3,
          maxSlides: 3,
          moveSlides: 1,
          slideMargin: 15,
          nextText: '<i class="fa fa-caret-right" aria-hidden="true"></i>',
          prevText: '<i class="fa fa-caret-left" aria-hidden="true"></i>',
          infiniteLoop: false,
          hideControlOnEnd: true,
          pager: false
      });
      window.slider = slider;
});
