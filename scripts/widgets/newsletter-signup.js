require(['modules/jquery-mozu', 'underscore', 'hyprlive'], function($, _, Hypr) {
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
        
      // Add placeholders.
      $('#first_name_'+getFormId()).prop( 'placeholder', Hypr.getLabel('firstName') + ' *' );
      $('#last_name_'+getFormId()).prop( 'placeholder', Hypr.getLabel('lastName') + ' *' );
      $('#email_address_'+getFormId()).prop( 'placeholder', Hypr.getLabel('emailAddress') + ' *' );

      // Reorder fields.
      $('#email_address_field_'+getFormId()).insertAfter($('#last_name_field_'+getFormId()));

      // Customize brith-date field.
      $('#custom_field_string_custom_field_2_'+getFormId() ).prop( 'type', 'hidden' );
      $('#custom_field_string_custom_field_2_label_'+getFormId()).html( Hypr.getLabel('newsletterBirthday'));
      $('#custom_field_string_custom_field_2_field_'+getFormId() ).append( $( '#template-newsletter-dob' ).html() );
      $("#input_dob_day").remove();
      var year = (new Date()).getFullYear()-13;
      var endYear = year-90;
      for (year; year>endYear; year--){
        $('<option/>').val(year).html(year).appendTo('#input_dob_year');
      }

      $( '#custom_field_string_custom_field_2_field_'+getFormId()  ).after(
        '<div style="clear:both">You must be over 13 years of age to sign up for our newsletter.<br />Please see our <a href=\"/privacy-policy\">Privacy Policy</a> for details.</div>'
      );
                
      // Customize user-type field.
      $( '#custom_field_string_user_type_'+getFormId()).prop( 'type', 'hidden' );
      $( '#custom_field_string_user_type_field_'+getFormId()).insertAfter($('#email_address_field'+getFormId()));      
      $( '#custom_field_string_user_type_field_'+getFormId()).append( $( '#template-newsletter-usertype').html() );
      $( '#custom_field_string_user_type_label_'+getFormId()).html( Hypr.getLabel('userType') );

      // Customize skin-type field.
      $( '#custom_field_string_skin_type_label_'+getFormId() ).html( Hypr.getLabel( 'skinType' ) + ' *' );
      $( '#custom_field_string_skin_type_'+getFormId() ).prop( 'type', 'hidden' );
      $( '#custom_field_string_skin_type_field_'+getFormId() ).append( $( '#template-newsletter-skintype' ).html() );

      // Setup consumer-dependent fields (group)
      $( '#custom_field_string_skin_type_field_'+getFormId() ).after( $( '#template-newsletter-consumer-group' ).html() );
      $( '#consumer-field' ).append($( '#custom_field_custom_field_2_'+getFormId() ),
                                    $( '#custom_field_string_skin_type_field_'+getFormId() ));

      // Insert disclaimer.
      $( '#newsletter-form' ).after( $( '#template-newsletter-disclaimer' ).html() );

      // Handle user type changes.
      $( '.input_usertype' ).change( function() {
          $( '.input_usertype' ).removeClass( 'is-error' ).prop( 'checked', false );

          $( this ).prop( 'checked', true );

          var value = $(this).prop('value');
          $( '#custom_field_string_user_type_'+getFormId() ).prop( 'value', value );

          if(value == 'Advisor' || value == 'Conseiller') {
              $( '#consumer-field' ).hide( 'slow' );
          }else if(value == 'Consumer' || value == 'Consommateur'){
              $( '#consumer-field' ).show( 'slow' );
          }

          //$('.ctct-form-button').prop('disabled',true);
      });

      // Handle skin-type changes.
      $( '#input_skintype' ).change( function() {
          $( '#custom_field_string_skin_type_'+getFormId() ).prop( 'value', $( this ).prop( 'value' ) );
      });

    $( '#input_dob_month' ).change( function() {
        updateDoB();
    });
    $( '#input_dob_year' ).change( function() {
        updateDoB();
    });

      //verified if the age_error cookie was set
      if ($.cookie('mozu-newsletter-age') ) {
        console.log('mozu-newsletter-age is true'); 
        $('#input_dob_month').prop('disabled', 'disabled');
        $('#input_dob_year').prop('disabled', 'disabled');
        console.log('mozu-newsletter-age disable'); 
        
      }

      var $submit = $( '.ctct-form-button' );

      $submit.hide();
      $submit.after( $( '#template-newsletter-submit' ).html() );

      // Validate form (custom, supplemental).
      $( '#newsletter-form input' ).keydown( function() {
        $( this ).removeClass( 'is-error' );
      });

      $( '#newsletter-form select' ).change( function() {
        $( this ).removeClass( 'is-error' );
      });

      $( '[data-role="submit-override"]' ).click( function( ev ) {
        var valid = true;

        _.each( ['#first_name_'+getFormId(),
                '#last_name_'+getFormId(),
                '#email_address_'+getFormId()], 
                function( id ) {
                    $( id ).removeClass( 'is-error' );
                    if ( $( id ).val() === '' ) {
                        $( id ).addClass( 'is-error' );
                        valid = false;
                    }
                });

        // User Type
        $( '.input_usertype' ).removeClass( 'is-error' );
        if ( $( '#custom_field_string_user_type_'+getFormId() ).val() === '' ) {
          $( '.input_usertype' ).addClass( 'is-error' );
          valid = false;
        }

        // Skin Type
        $( '.input_skintype' ).removeClass( 'is-error' );
        if ( $( '#custom_field_string_user_type_'+getFormId() ).val() === 'Consumer' && $( '#custom_field_string_skin_type_'+getFormId() ).val() === '' ) {
          $( '.input_skintype' ).addClass( 'is-error' );
          valid = false;
        }

        // DOB
        $( '.input_age' ).removeClass( 'is-error' );
        if ( $( '#custom_field_string_custom_field_2_'+getFormId() ).val() === '') {
          $( '.input_age' ).addClass( 'is-error' );
          valid = false;
        }

        if ( valid ) {
          // Pass the click through to the real submit button.
          $submit.click();
        }else {
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
      $( '#custom_field_string_custom_field_2_'+getFormId() ).prop( 'value', $('#input_dob_month').prop( 'value' )+" "+$( '#input_dob_year' ).prop( 'value' ) );
    }else {
      $( '#custom_field_string_custom_field_2_'+getFormId() ).prop( 'value', '' );
    }
  }
  function setDateErrorCookie() {
    $.cookie('mozu-newsletter-age', true ); //, { path: '/' });
    $('#input_dob_month').prop('disabled', 'disabled');
    $('#input_dob_year').prop('disabled', 'disabled');
  }
  function setDateError() {
    $( '#input_dob_month' ).addClass( 'is-error' );
    $( '#input_dob_year' ).addClass( 'is-error' );
  }
  function removeDateError() {
    $( '#input_dob_month' ).removeClass( 'is-error' );
    $( '#input_dob_year' ).removeClass( 'is-error' );
  }

  function checkDate() {

    var month = $( '#input_dob_month' ).prop( 'value' );
    var year = $( '#input_dob_year' ).prop( 'value' );

    if ( month === '' || year === '' ){
        setDateError();
        return false;
    }

    var input = new Date( month + '/01/' + year );
    var today = new Date();

    var ageResult = checkAge(input, 13);
    if (ageResult) {
      removeDateError();
    }else {
      setDateError();
      setDateErrorCookie(); 
    }
    return ageResult;
  }

  function checkAge(dateToCheck, minimumAge) {
      
    var today = new Date();

    if (today.getFullYear() - dateToCheck.getFullYear() < minimumAge) return false;

    if (today.getFullYear() - dateToCheck.getFullYear() == minimumAge) {
      if (today.getMonth() < dateToCheck.getMonth()) return false;
      if (today.getMonth() == dateToCheck.getMonth()) return false;
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
