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
        
      // Add placeholders.
      $('#first_name_'+getFormId()).prop( 'placeholder', Hypr.getLabel('firstName') + ' *' );
      $('#last_name_'+getFormId()).prop( 'placeholder', Hypr.getLabel('lastName') + ' *' );
      $('#email_address_'+getFormId()).prop( 'placeholder', Hypr.getLabel('emailAddress') + ' *' );

      // Reorder fields.
      $('#email_address_field_'+getFormId()).insertAfter($('#last_name_field_'+getFormId()));

      // Customize brith-date field.
      $('#custom_field_string_custom_field_2_'+getFormId() ).prop( 'type', 'hidden' );
      $('#custom_field_string_custom_field_2_label_'+getFormId()).html( Hypr.getLabel('newsletterBirthday')+ ' *' );
      $('#custom_field_string_custom_field_2_field_'+getFormId() ).append( $( '#template-newsletter-dob' ).html() );
      var currentYear = (new Date()).getFullYear();
      var fromYear = currentYear-101;
      for (fromYear; fromYear<currentYear; fromYear++){
        $('<option/>').val(fromYear).html(fromYear).appendTo('#input_dob_year');
      }

      // Customize skin-type field.
      $( '#custom_field_string_custom_field_1_label_'+getFormId() ).html( Hypr.getLabel( 'skinType' ) + ' *' );
      $( '#custom_field_string_custom_field_1_'+getFormId() ).prop( 'type', 'hidden' );
      $( '#custom_field_string_custom_field_1_field_'+getFormId() ).append( $( '#template-newsletter-skintype' ).html() );

      // Setup consumer-dependent fields (group)
      $( '#consumer-field' ).append(
                                $( '#custom_field_string_custom_field_2_field_'+getFormId() ),
                                $( '#custom_field_string_custom_field_1_field_'+getFormId() )
        );

      // Insert disclaimer.
      $( '#newsletter-form' ).after( $( '#template-newsletter-disclaimer' ).html() );


      // Handle skin-type changes.
      $( '#input_skintype' ).change( function() {
          $( '#custom_field_string_custom_field_1_'+getFormId() ).prop( 'value', $( this ).prop( 'value' ) );
      });
      
      $( '#input_dob_month' ).change( function() {
          $( '#custom_field_string_custom_field_2_'+getFormId() ).prop( 'value', $( this ).prop( 'value' ) +" "+ $( '#input_dob_year' ).prop( 'value' ) );
      });
      $( '#input_dob_day' ).change( function() {
        $( '#custom_field_string_custom_field_2_'+getFormId() ).prop( 'value', $( this ).prop( 'value' ) +" "+ $( '#input_dob_year' ).prop( 'value' ) );
    });
      $( '#input_dob_year' ).change( function() {
          $( '#custom_field_string_custom_field_2_'+getFormId() ).prop( 'value', $( '#input_dob_month' ).prop( 'value' ) +" "+ $( this ).prop( 'value' ) );
      });

      $( '#input_newsletter_confirmation' ).change( function() {
          $( '.ctct-form-button' ).prop( 'disabled', !this.checked );
      });

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

        // Skin Type
        $('.input_skintype' ).removeClass( 'is-error' );
        if($( '#custom_field_string_custom_field_1_'+getFormId() ).val() === '' ) {
          $( '.input_skintype' ).addClass( 'is-error' );
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

  function checkDate() {
      
    var month = $( '#input_dob_month' ).prop( 'value' );
    if ( month === '' ){
        $( '#input_dob_month' ).addClass( 'is-error' );
        return false;
    }
/*
    var day = $( '#custom_field_date_b-day_day_0' ).val();
    if ( day === '' ) return false;
*/
    var year = $( '#input_dob_year' ).prop( 'value' );
    if ( year === '' ){
        $( '#input_dob_year' ).addClass( 'is-error' );
        return false;
    }
    var day = $( '#iinput_dob_day' ).prop( 'value' );
    if ( day === '' ){
        $( '#input_dob_day' ).addClass( 'is-error' );
        return false;
    }
/*
    var input = Date.parse( month + '/' + day + '/' + year );
    var today = new Date();

    if ( today <= input ) {
      return false;
    }

    var diff = ( today - input ) / ( 1000 * 60 * 60 * 24 * 365 );
    if( diff < 13 ) {
      return false;
    }
*/
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
