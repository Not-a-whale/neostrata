require(['modules/jquery-mozu', 'underscore', 'hyprlive'], function($,  _,  Hypr) {
    var config = {attributes: true,
                childList: true,
                characterData: true};

    var observer = new MutationObserver( function( mutations ) {
        if ( $( "#newsletter-form" ).has( $('.ctct-form-element') ).length ) {
          initOnce();
        }


        var successMessage = '#success_message_'+getFormId();
        if($(successMessage).is( ':visible' ) ) {
          $('.required-fields').hide();
          $('#newsletter-disclaimer').hide();
          $('.newsletter-confirmation').hide();
          observer.disconnect();
        }
    });

  observer.observe( document.body, config );

  var didInit = false;
  function initOnce() {
    if ( !didInit ) {


      var form = $('ctct_form_'+getFormId());
      form.submit(function(event) {
        // Prevent default form action
        console.log('Submit called');
        event.preventDefault();
        return false;

      });
      // Add placeholders.
      $('#first_name_'+getFormId()).prop( 'placeholder', Hypr.getLabel('firstName') + ' *' );
      $('#last_name_'+getFormId()).prop( 'placeholder', Hypr.getLabel('lastName') + ' *' );
      $('#email_address_'+getFormId()).prop( 'placeholder', Hypr.getLabel('emailAddress') + ' *' );

      // Reorder fields.
      $('#email_address_field_'+getFormId()).insertAfter($('#last_name_field_'+getFormId()));

      // Customize skin-type field.
      $( '#custom_field_string_custom_field_1_label_'+getFormId() ).html( Hypr.getLabel( 'skinType' ));
      $( '#custom_field_string_custom_field_1_'+getFormId() ).prop( 'type', 'hidden' );
      $( '#custom_field_string_custom_field_1_field_'+getFormId() ).append( $( '#template-newsletter-skintype' ).html() );

      // Customize brith-date field.
      $('#custom_field_string_custom_field_2_'+getFormId() ).prop( 'type', 'hidden' );
      $('#custom_field_string_custom_field_2_label_'+getFormId()).html( Hypr.getLabel('newsletterBirthday'));
      $('#custom_field_string_custom_field_2_field_'+getFormId() ).append( $( '#template-newsletter-dob' ).html() );
      var year = (new Date()).getFullYear()-13;
      var endYear = year-90;
      for (year; year>endYear; year--){
        $('<option/>').val(year).html(year).appendTo('#input_dob_year');
      }

      $( '#custom_field_string_custom_field_2_field_'+getFormId()  ).after(
        '<div style="clear:both">You must be over 13 years of age to sign up for our newsletter.<br />Please see our <a href=\"/privacy-policy\">Privacy Policy</a> for details.</div>'
      );

      // Insert disclaimer.
      $( '#newsletter-form' ).after( $( '#template-newsletter-disclaimer' ).html() );

      // Handle skin-type changes.
      $( '#input_skintype' ).change( function() {
          $( '#custom_field_string_custom_field_1_'+getFormId() ).prop( 'value', $( '#input_skintype' ).prop( 'value' ) );
      });

      $( '#input_dob_month' ).change( function() {
        updateDoB();
      });
      $( '#input_dob_day' ).change( function() {
        updateDoB();
      });
      $( '#input_dob_year' ).change( function() {
        updateDoB();
      });

      var $submit = $( '.ctct-form-button' );

      $submit.hide();
      $submit.after( $( '#template-newsletter-submit' ).html() );

      $( '#newsletter-form select' ).change( function(event) {
        $( this ).removeClass( 'is-error' );
        if(event.target.id === 'input_skintype'){
          $( '#input_skintype' ).val(event.target.value);
        }
        if(checkDate() && $( '#first_name_'+getFormId() ).val() !== '' && $( '#last_name_'+getFormId() ).val() !== '' && $('#email_address_'+getFormId()).val() !== ''){
          $('.ctct-form-button').hide();
          $('*[data-qe-id="form-button"]').show();
        }
      });
      $('*[data-qe-id="form-button"]').click( function() {
        $('#newsletter-disclaimer > p').html('');
        $('#newsletter-form > .required-fields').html('');
      });
      $( '[data-role="submit-override"]' ).click( function( ev ) {
        var valid = true;

        _.each( [
          '#first_name_'+getFormId(),
          '#last_name_'+getFormId(),
          '#email_address_'+getFormId()
        ], function( id ) {
          $( id ).removeClass( 'is-error' );
          if ( $( id ).val() === '' ) {
            $( id ).addClass( 'is-error' );
            valid = false;
          }
        });

        $( '#input_newsletter_confirmation' ).removeClass( 'is-error' );
        if (!$( '#input_newsletter_confirmation' ).prop("checked")) {
          $( '#input_newsletter_confirmation' ).addClass( 'is-error' );
          valid = false;
          $('html, body').animate({scrollTop: $( '#input_newsletter_confirmation' ).offset().top}, 1500);
        }

        // Date
        $( '.input_age' ).removeClass( 'is-error' );
        if (!checkDate() ) {
          valid = false;
        }

        if ( valid ) {
          // Pass the click through to the real submit button.
          $submit.click();
        }
        else {
          // Scroll to the top of the form.
          $( document ).scrollTop( $( '#newsletter-form' ).offset().top - 150 );
        }
      });

      $('#success_message_'+getFormId()+' h2').html( Hypr.getLabel('newsletterThanksHeader') );
      $('#success_message_'+getFormId()+' p').html( Hypr.getLabel('newsletterThanksText') );

      // Reveal form.
      $('#newsletter-form').show();

      didInit = true;
    }
  }

  function updateDoB() {
    $( '#custom_field_string_custom_field_2_'+getFormId() ).prop( 'value', null );

    if (checkDate()) {
      $( '#custom_field_string_custom_field_2_'+getFormId() ).prop( 'value', $('#input_dob_month').prop( 'value' ) +" "+ $('#input_dob_day').prop( 'value' ) +" "+$( '#input_dob_year' ).prop( 'value' ) );
    }
    else {
      $( '#custom_field_string_custom_field_2_'+getFormId() ).prop( 'value', '' );
    }
  }

  function checkDate() {
    var month = $( '#input_dob_month' ).prop( 'value' );
    if ( month === '' ){
        $( '#input_dob_month' ).addClass( 'is-error' );
        return false;
    }
    var day = $( '#input_dob_day' ).prop( 'value' );
    if ( day === '' ){
        $( '#input_dob_day' ).addClass( 'is-error' );
        return false;
    }
    var year = $( '#input_dob_year' ).prop( 'value' );
    if ( year === '' ){
        $( '#input_dob_year' ).addClass( 'is-error' );
        return false;
    }

    var input = new Date( month + '/' + day + '/' + year );
    var today = new Date();

    if ( today <= input ) {
      return false;
    }

    return checkAge(input, 13);
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


  function getFormId(){
      return $( 'form.ctct-form-custom').attr('id').split("_").pop();
  }

  // Load the ConstantContact sign-up widget library.
  var script = document.createElement( 'script' );
  script.src = '//static.ctctcdn.com/js/signup-form-widget/current/signup-form-widget.min.js';

  $( script ).insertAfter( '#cc-universal' );
});
