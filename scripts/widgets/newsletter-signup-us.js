require([
  'modules/jquery-mozu',
  'underscore',
  'hyprlive'
], function(
  $,
  _,
  Hypr
) {
  var config = {
    attributes: true,
    childList: true,
    characterData: true
  };

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
      $('#custom_field_string_user_type_field_'+getFormId()).insertAfter($('#email_address_field'+getFormId()));

      // Customize user-type field.
      $( '#custom_field_string_user_type_'+getFormId()).prop( 'type', 'hidden' );
      $( '#custom_field_string_user_type_field_'+getFormId()).append( $( '#template-newsletter-usertype').html() );

      // Customize user-type label
      $( '#custom_field_string_user_type_label_'+getFormId()).html( Hypr.getLabel('userType') );

      // Customize brith-date field.
      $( '#custom_field_date_b-day_label_'+getFormId()).html( Hypr.getLabel('newsletterBirthday')+ ' *' );

      $('#custom_field_date_b-day_month_'+getFormId()).addClass( 'input_age' );
      $('#custom_field_date_b-day_day_'+getFormId()).addClass( 'input_age' );
      $('#custom_field_date_b-day_year_'+getFormId()).addClass( 'input_age' );

      // Customize skin-type field.
      $( '#custom_field_string_skin_type_label_'+getFormId() ).html( Hypr.getLabel( 'skinType' ) + ' *' );
      $( '#custom_field_string_skin_type_'+getFormId() ).prop( 'type', 'hidden' );

      $( '#custom_field_string_skin_type_field_'+getFormId() ).append( $( '#template-newsletter-skintype' ).html() );

      // Setup consumer-dependent fields (group)
      $( '#custom_field_string_user_type_field_'+getFormId() ).after( $( '#template-newsletter-consumer-group' ).html() );
      $( '#consumer-field' )
        .append(
          $( '#custom_field_date_b-day_field_'+getFormId() ),
          $( '#custom_field_string_skin_type_field_'+getFormId() )
        );

      // Insert disclaimer.
      $( '#newsletter-form' ).before( $( '#template-newsletter-disclaimer' ).html() );

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

        // User Type
        $( '.input_usertype' ).removeClass( 'is-error' );
        if ( $( '#custom_field_string_user_type_'+getFormId() ).val() === '' ) {
          $( '.input_usertype' ).addClass( 'is-error' );
          valid = false;
        }

        // Date
        $( '.input_age' ).removeClass( 'is-error' );
        if ( $( '#custom_field_string_user_type_'+getFormId() ).val() === 'Consumer' && !checkDate() ) {
          $( '.input_age' ).addClass( 'is-error' );
          valid = false;
        }

        // Skin Type
        $( '.input_skintype' ).removeClass( 'is-error' );
        if ( $( '#custom_field_string_user_type_'+getFormId() ).val() === 'Consumer' && $( '#custom_field_string_skin_type_'+getFormId() ).val() === '' ) {
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
    var month = $( '#custom_field_date_b-day_month_0' ).val();
    if ( month === '' ) return false;

    var day = $( '#custom_field_date_b-day_day_0' ).val();
    if ( day === '' ) return false;

    var year = $( '#custom_field_date_b-day_year_0' ).val();
    if ( year === '' ) return false;

    var input = Date.parse( month + '/' + day + '/' + year );
    var today = new Date();

    if ( today <= input ) {
      return false;
    }

    var diff = ( today - input ) / ( 1000 * 60 * 60 * 24 * 365 );
    if( diff < 13 ) {
      return false;
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
