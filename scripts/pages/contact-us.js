define(['modules/jquery-mozu', 'hyprlive'], function ($, hypr) {
  $(document).ready(function () {

    if (window.location.pathname === '/contact-us') {
        
        var dropdown = $('.wufoo-dropdown'),
            dropdownLabel = $('.wufoo-dropdown-control span.text'),
            dropdownControl = $('.wufoo-dropdown-control'),
            dropdownOptions = '<ul class="wufoo-dropdown-menu"> <li class = "" > Select a Topic </li> <li class = "" > International Inquiry </li> <li class = "" > Customer Service Inquiry </li> </ul>';
        var ddCounter = 0;

        dropdownLabel.click(function (e) {
            ddCounter++;

            if(ddCounter % 2 === 0) {
                // dropdownControl.remove($('span.text'));
                dropdownControl.append(dropdownOptions).addClass('open');

                handleOptionClick();
            } else {
                dropdown.find($('ul')).remove();
                dropdownControl.removeClass('open');
            }
        });
    } else if(window.location.pathname === '/affiliate') {
        $('[name="form-email"]').val(hypr.getThemeSetting('affiliateEmail'));        
    }

        $('#saveForm').click(function (e) {
            e.preventDefault();
            
            $('[name="submit-email-form"]').trigger('click');
        });
    });
    
    function handleOptionClick() {
        var select = $('[data-wufoo-field="dropdown"]#Field4'),
            dropdownLabel = $('.wufoo-dropdown-control span.text');

        $('ul.wufoo-dropdown-menu li').click(function(e) {
            e.stopPropagation();
            
            var option = $(e.target).text().trim();

            $('[data-wufoo-field="dropdown"]#Field4 option').prop("selected", false);
    
            select.find( $('option[value="' + option + '"]')).prop("selected", true);

            if (option === 'International Inquiry') {
                $('[name="form-email"]').val(hypr.getThemeSetting('internationalInquiryEmail'));
            } else if (option === 'Customer Service Inquiry') {
                $('[name="form-email"]').val(hypr.getThemeSetting('customerServiceEmail'));
            } if (option === 'Select a Topic') {
                $('[name="form-email"]').val('');
            }
            dropdownLabel.text(option);

            $('.wufoo-dropdown ul').remove();    
        });
    }

});
