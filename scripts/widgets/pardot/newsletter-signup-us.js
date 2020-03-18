require(['modules/jquery-mozu', 'underscore', 'hyprlive', 'modules/api'], function ($, _, Hypr, api) {
  var config = {
    attributes: true,
    childList: true,
    characterData: true
  };

  var observer = new MutationObserver(function (mutations) {
    if ($("#newsletter-form").has($('.form-element')).length) {
      initOnce();
    }

    var successMessage = '#success_message_' + getFormId();
    if ($(successMessage).is(':visible')) {
      $('.required-fields').hide();
      $('#newsletter-disclaimer > p').html('');
      $('.newsletter-confirmation').hide();
      observer.disconnect();
    }
  });

  observer.observe(document.body, config);

  var didInit = false;
  function initOnce() {
    if (!didInit) {

      // Add placeholders.
      $('#first_name_' + getFormId()).prop('placeholder', Hypr.getLabel('firstName') + ' *');
      $('#last_name_' + getFormId()).prop('placeholder', Hypr.getLabel('lastName') + ' *');
      $('#email_address_' + getFormId()).prop('placeholder', Hypr.getLabel('emailAddress') + ' *');

      // Reorder fields.
      $('#email_address_field_' + getFormId()).insertAfter($('#last_name_field_' + getFormId()));

      // Customize skin-type field.
      /* $('#custom_field_string_custom_field_1_label_' + getFormId()).html(Hypr.getLabel('skinType'));
      $('#custom_field_string_custom_field_1_' + getFormId()).prop('type', 'hidden');
      $('#custom_field_string_custom_field_1_field_' + getFormId()).append($('#template-newsletter-skintype').html()); */

      // Customize brith-date field.
      //$('#custom_field_string_custom_field_2_'+getFormId() ).prop( 'type', 'hidden' );
      //$('#custom_field_string_custom_field_2_label_'+getFormId()).html( Hypr.getLabel('newsletterBirthday'));
      //$('#custom_field_string_custom_field_2_field_'+getFormId() ).append( $( '#template-newsletter-dob' ).html() );
      //var year = (new Date()).getFullYear()-13;
      //var endYear = year-90;
      //for (year; year>endYear; year--){
      //  $('<option/>').val(year).html(year).appendTo('#input_dob_year');
      // }

      $('#custom_field_string_custom_field_1_field_' + getFormId()).after(
        '<div style="clear:both">You must be over 13 years of age to sign up for our newsletter.<br />Please see our <a href=\"/privacy-policy\">Privacy Policy</a> for details.</div>'
      );

      // Insert disclaimer.
      $('#newsletter-form').after($('#template-newsletter-disclaimer').html());

      // Handle skin-type changes.
      // $('#input_skintype').change(function () {
      //   $('#custom_field_string_custom_field_1_' + getFormId()).prop('value', $('#input_skintype').prop('value'));
      // });

      //$( '#input_dob_month' ).change( function() {
      //  updateDoB();
      //});
      //$( '#input_dob_day' ).change( function() {
      //  updateDoB();
      //});
      //$( '#input_dob_year' ).change( function() {
      //  updateDoB();
      //});

      //verified if the age_error cookie was set
      //if ($.cookie('mozu-newsletter-age') ) {
      //  console.log('mozu-newsletter-age is true'); 
      //  $('#input_dob_month').prop('disabled', 'disabled');
      //  $('#input_dob_day').prop('disabled', 'disabled');
      //  $('#input_dob_year').prop('disabled', 'disabled');
      //  console.log('mozu-newsletter-age disable'); 

      //}

      var $submit = $('.form-button');

      $submit.after($('#template-newsletter-submit').html());

      $('*[data-qe-id="form-button"]').click(function (e) {
        var firstName = $('input[name="first_name"]').first().val();
        var emailAddress = $('input[name="email_address"]').first().val();
        var lastName = $('input[name="last_name"]').first().val();
        var skinType = $('#skintype option:selected').val();
        var params = { EmailAddress: emailAddress, firstName: firstName, lastName: lastName, skinType: skinType, source: 'signup'};

        e.preventDefault();
        $('#error_message_2').hide();
        $('#success_message_2').hide();
        if (validate()) {
          api.request('POST', "/events/signup", params).then(function (response) {
            if (!response.error) {
              $('.form-custom').hide();
              $('#success_message_2').show();
            }
            else
              $('#error_message_2').show();
          });
        }
      });


      $('#success_message_' + getFormId() + ' h2').html(Hypr.getLabel('newsletterThanksHeader'));
      $('#success_message_' + getFormId() + ' p').html(Hypr.getLabel('newsletterThanksText'));

      // Reveal form.
      $('#newsletter-form').show();

      didInit = true;
    }
  }

  function validate() {
    var isValid = true;
    $('input').removeClass('is-error');

    if ($('input[name="first_name"]').first().val() === "") {
      $('input[name="first_name"]').first().addClass('is-error');
      isValid = false;
    }

    if ($('input[name="last_name"]').first().val() === "") {
      $('input[name="last_name"]').first().addClass('is-error');
      isValid = false;
    }

    var email = $('input[name="email_address"]').first().val();
    if (email === "") {
      $('input[name="email_address"]').first().addClass('is-error');
      isValid = false;
    }

    if (!(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email))) {
      $('input[name="email_address"]').first().addClass('is-error');
      isValid = false;
    }

    return isValid;
  }

  function updateDoB() {
    $('#custom_field_string_custom_field_2_' + getFormId()).prop('value', null);

    if (checkDate()) {
      $('#custom_field_string_custom_field_2_' + getFormId()).prop('value', $('#input_dob_month').prop('value') + " " + $('#input_dob_day').prop('value') + " " + $('#input_dob_year').prop('value'));
    }
    else {
      $('#custom_field_string_custom_field_2_' + getFormId()).prop('value', '');
    }
  }
  function setDateErrorCookie() {
    $.cookie('mozu-newsletter-age', true); //, { path: '/' });
    $('#input_dob_month').prop('disabled', 'disabled');
    $('#input_dob_day').prop('disabled', 'disabled');
    $('#input_dob_year').prop('disabled', 'disabled');
  }
  function setDateError() {
    $('#input_dob_month').addClass('is-error');
    $('#input_dob_day').addClass('is-error');
    $('#input_dob_year').addClass('is-error');
  }
  function removeDateError() {
    $('#input_dob_month').removeClass('is-error');
    $('#input_dob_day').removeClass('is-error');
    $('#input_dob_year').removeClass('is-error');
  }

  function checkDate() {

    var month = $('#input_dob_month').prop('value');
    var day = $('#input_dob_day').prop('value');
    var year = $('#input_dob_year').prop('value');

    if (month === '' || day === '' || year === '') {
      removeDateError();
      return false;
    }

    var input = new Date(month + '/' + day + '/' + year);
    var today = new Date();

    var ageResult = checkAge(input, 13);
    if (ageResult) {
      removeDateError();
    }
    else {
      setDateError();
      setDateErrorCookie();
    }
    return ageResult;
  }

  function checkAge(dateToCheck, minimumAge) {
    var today = new Date();

    if (today.getFullYear() - dateToCheck.getFullYear() < minimumAge) {
      return false;
    }

    if (today.getFullYear() - dateToCheck.getFullYear() == minimumAge) {
      if (today.getMonth() < dateToCheck.getMonth()) {
        return false;
      }
      if (today.getMonth() == dateToCheck.getMonth()) {
        if (today.getDate() < dateToCheck.getDate()) {
          return false;
        }
      }
    }
    return true;
  }


  function getFormId() {
    return $('form.form-custom').attr('id').split("_").pop();
  }
});
