define([
    'modules/jquery-mozu',
    "doubletaptogo"
], function($, doubletaptogo) {
    //Sub Dropdown Menu
    function calculatingSubPosition() {
        var leftReference = $(".ml-header-content").offset().left,
            rightReference = leftReference + $(".ml-header-content").outerWidth(),
            colWidth = $(document).width() > 991 ? 235 : 175;
        $(".mz-sitenav-sub-container").css({ "left": 0, "right": "auto" }).addClass("calculating-position").removeClass("calculated-position").each(function() {
            var currentElemnt = $(this),
                leftPosition = -10,
                rightPosition = 0,
                currentDropWidth = 0;
            if ( currentElemnt.find(".sub-level-col").length>=4 && $(document).width() <= 1025) {
                currentElemnt.find(".sub-level-image").hide();
            }
            else {
                currentElemnt.find(".sub-level-image").show();
            }
            currentDropWidth = (colWidth * currentElemnt.find(".sub-level-col").length) + 35 + currentElemnt.find(".sub-level-image").outerWidth()||0;
            if (currentDropWidth < $(".container:eq(0)").outerWidth()) {
                leftPosition = currentElemnt.parents(".mz-sitenav-item-inner").offset().left - 20 - leftReference;
                rightPosition = "auto";
                if (leftPosition + currentDropWidth + leftReference >= rightReference) {
                    leftPosition = "auto";
                    rightPosition = 0;
                }
            }
            currentElemnt.css({ "left": leftPosition, "right": rightPosition });
        }).removeClass("calculating-position").addClass("calculated-position");
    }
    function closeElement(element){
		$( element ).siblings( '.mz-sitenav-sub-container' ).animate( { 'height': 0 }, {
			duration: 400,
			easing: 'linear',
			done: function () {
                $( element ).siblings( '.mz-sitenav-sub-container' ).removeClass( 'expand-mobile-menu' );
                $( element ).removeClass( 'selected' );
			}
		} );
	}
    function closeSecondLevel(element){
		$( element ).siblings( '.sub-level-li-children' ).animate( { 'height': 0 }, {
			duration: 400,
			easing: 'linear',
			done: function () {
                $( element ).siblings( '.sub-level-li-children' ).removeClass( 'expand-mobile-menu' );
                $( element ).removeClass( 'selected' );
			}
		} );
	}
    function initialize_mobile_menu(){
        var $top_level = $('.mz-sitenav .mz-sitenav-list >.mz-sitenav-item >.mz-sitenav-item-inner >.mz-sitenav-link');
        var $second_level = $('.mz-sitenav .sub-level-li>.mz-sitenav-link');
        $top_level.off('click').click(function(){
            console.log('top level click');
            var $self = $( this );
            if($( this ).hasClass('selected')) {
				closeElement(this);
            }
            else{
                var height = ($self.siblings( '.mz-sitenav-sub-container' ).get(0).scrollHeight)+'px';
                $( this ).siblings( '.mz-sitenav-sub-container' ).animate( { height: height, 'max-height': height }, {
                    duration: 400,
                    easing: 'linear',
                    done: function () {
                        $self.siblings( '.mz-sitenav-sub-container' ).addClass( 'expand-mobile-menu' );
                        $self.addClass( 'selected' );
                        $(this).css('height', 'auto');
                        $(this).css('max-height', '2000px');
                    }
                } );
                closeElement($( '.mz-sitenav .mz-sitenav-list .expand-mobile-menu' ).siblings('.mz-sitenav-link'));
            }
            return false;
        });
        $second_level.off('click').click(function(){
            console.log('Click second level',$( this ).hasClass('selected'));
            var $self = $( this );
            if($( this ).hasClass('selected')) {
                closeSecondLevel(this);
            }
            else{
                var height = ($self.siblings( '.sub-level-li-children' ).get(0).scrollHeight)+'px';
                console.log('secondlevel', height);
                $( this ).siblings( '.sub-level-li-children' ).animate( { height: height, 'max-height': height }, {
                    duration: 400,
                    easing: 'linear',
                    done: function () {
                        $self.siblings( '.sub-level-li-children' ).addClass( 'expand-mobile-menu' );
                        $self.addClass( 'selected' );
                    }
                } );
                closeSecondLevel($( '.sub-level-li-children.expand-mobile-menu' ).siblings('.mz-sitenav-link'));
            }
            return false;
        });
    }
    function reset_mobile_menu(){
        var $top_level = $('.mz-sitenav .mz-sitenav-list >.mz-sitenav-item >.mz-sitenav-item-inner >.mz-sitenav-link');
        $top_level.off('click');
    }
    function window_resize(){
        if(window.outerWidth<992){
            initialize_mobile_menu();
        }
        else{
            reset_mobile_menu();
            //calculatingSubPosition();
        }
    }
    $(document).ready(function() {
        window_resize();
        try {
            $('.sub-nav-section li:has(.sub-dropdown-menu)').doubletaptogo();
        } catch (e0) {
            //console.log('Error in loading: ' + e0);
        }
    });
    $(window).resize(function() {
        window_resize();
    });
    $('.sub-level-col.col-sm-3').each(function(index, el) {
        var html = $(el).html().trim();
        if (html === "")
            $(el).remove();
    });
    $('.sub-level-image.col-sm-3').each(function(index, el){
         var html = $(el).find('img').attr('src');
         if (html === "" || html === '#')
            $(el).remove();
    });
    //calculatingSubPosition();
    //Footer Back to Top
    if ($(".back-to-top").length) {
        $(".back-to-top").click(function() {
            $("html, body").animate({ scrollTop: 0 }, 500);
        });
    }
});