define(['modules/jquery-mozu', 'hyprlive', 'hyprlivecontext'], function ($, hypr, hyprlivecontext) {
  $(document).ready(function () {
    var isExu = hyprlivecontext.locals.themeSettings.themeSelector === 'exuviance' ? true : false;

    if (isExu) {
      if (window.location.pathname === '/contact-us') {

        var select = $('select#Field4'),
          option = select.val();

        select.change(function (e) {
          option = select.val();

          if (option === 'International Inquiry') {
            $('[name="form-email"]').val(hypr.getThemeSetting('internationalInquiryEmailEXU'));
          } else if (option === 'Customer Service Inquiry') {
            $('[name="form-email"]').val(hypr.getThemeSetting('customerServiceEmailEXU'));
          }
          if (option === 'Select a topic of concern') {
            $('[name="form-email"]').val('');
          }

        });

      } else if (window.location.pathname === '/affiliate') {
        $('[name="form-email"]').val(hypr.getThemeSetting('affiliateEmailEXU'));
        handlePhoneInput();
      }

      $('#saveForm').click(function (e) {
        e.preventDefault();
        $('[name="submit-email-form"]').trigger('click');
      });
    } else {
      if (window.location.pathname === '/contact-us') {
        var dropdown = $('.wufoo-dropdown'),
          dropdownLabel = $('.wufoo-dropdown-control span.text'),
          dropdownControl = $('.wufoo-dropdown-control'),
          dropdownOptions = '<ul class="wufoo-dropdown-menu"> <li class = "" > Select a Topic </li> <li class = "" > International Inquiry </li> <li class = "" > Customer Service Inquiry </li> </ul>';
        var ddCounter = 0;

        dropdownLabel.click(function (e) {
          ddCounter++;

          if (ddCounter % 2 === 0) {
            // dropdownControl.remove($('span.text'));
            dropdownControl.append(dropdownOptions).addClass('open');

            handleOptionClick();
          } else {
            dropdown.find($('ul')).remove();
            dropdownControl.removeClass('open');
          }
        });
      } else if (window.location.pathname === '/affiliate') {
        $('[name="form-email"]').val(hypr.getThemeSetting('affiliateEmail'));
        handlePhoneInput();
      }

      $('#saveForm').click(function (e) {
        e.preventDefault();
        $('[name="submit-email-form"]').trigger('click');
      });
    }
  });

  function handlePhoneInput() {
    $('#Field7').on('change focus blur keyup keypress', function (e) {
      if (e.target.value.length === 3) {
        $('#Field7-1').focus();
      }
    });
    $('#Field7-1').on('change focus blur keyup keypress', function (e) {
      if (e.target.value.length === 3) {
        $('#Field7-2').focus();
      }
    });
  }

  function handleOptionClick() {
    var select = $('[data-wufoo-field="dropdown"]#Field4'),
      dropdownLabel = $('.wufoo-dropdown-control span.text');

    $('ul.wufoo-dropdown-menu li').click(function (e) {
      e.stopPropagation();

      var option = $(e.target).text().trim();

      $('[data-wufoo-field="dropdown"]#Field4 option').prop("selected", false);

      select.find($('option[value="' + option + '"]')).prop("selected", true);

      if (option === 'International Inquiry') {
        $('[name="form-email"]').val(hypr.getThemeSetting('internationalInquiryEmail'));
      } else if (option === 'Customer Service Inquiry') {
        $('[name="form-email"]').val(hypr.getThemeSetting('customerServiceEmail'));
      }
      if (option === 'Select a Topic') {
        $('[name="form-email"]').val('');
      }
      dropdownLabel.text(option);

      $('.wufoo-dropdown ul').remove();
    });
  }
});
