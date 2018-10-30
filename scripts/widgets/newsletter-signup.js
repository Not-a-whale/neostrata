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

    if( $( '#success_message_0' ).is( ':visible' ) ) {
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
      _.each({
        '#first_name_0':  Hypr.getLabel('firstName') + ' *',
        '#last_name_0':   Hypr.getLabel('lastName') + ' *',
        '#email_address_0': Hypr.getLabel('emailAddress') + ' *'
      }, function( placeholder, id ) {
        $( id ).prop( 'placeholder', placeholder );
      });

      // Reorder fields.
      $('#email_address_field_0').insertAfter($('#last_name_field_0'));
      $('#custom_field_string_user_type_field_0').insertAfter($('#email_address_field_0'));

      // Customize user-type field.
      $( '#custom_field_string_user_type_0' ).prop( 'type', 'hidden' );
      $( '#custom_field_string_user_type_field_0' ).append( $( '#template-newsletter-usertype' ).html() );

      // Customize brith-date field.
      $( '#custom_field_date_b-day_label_0' ).html( Hypr.getLabel('newsletterBirthday')+ ' *' );

      _.each( [
        '#custom_field_date_b-day_month_0',
        '#custom_field_date_b-day_day_0',
        '#custom_field_date_b-day_year_0'
      ], function( id ) {
        $( id ).addClass( 'input_age' );
      });

      // Customize skin-type field.
      $( '#custom_field_string_skin_type_label_0' ).html( Hypr.getLabel( 'skinType' ) + ' *' );
      $( '#custom_field_string_skin_type_0' ).prop( 'type', 'hidden' );

      $( '#custom_field_string_skin_type_field_0' ).append( $( '#template-newsletter-skintype' ).html() );

      // Setup consumer-dependent fields (group)
      $( '#custom_field_string_skin_type_field_0' ).after( $( '#template-newsletter-consumer-group' ).html() );
      $( '#consumer-field' )
        .append(
          $( '#custom_field_date_b-day_field_0' ),
          $( '#custom_field_string_skin_type_field_0' )
        );

      // Insert disclaimer.
      $( '#gdpr_text' ).after( $( '#template-newsletter-disclaimer' ).html() );

      // Handle user type changes.
      $( '.input_usertype' ).change( function() {
          $( '.input_usertype' ).removeClass( 'is-error' ).prop( 'checked', false );

          $( this ).prop( 'checked', true );

          var value = $(this).prop('value');
          $( '#custom_field_string_user_type_0' ).prop( 'value', value );

          switch ( value ) {
            case 'Advisor':
              $( '#consumer-field' ).hide( 'slow' );
              break;
            case 'Consumer':
              $( '#consumer-field' ).show( 'slow' );
              break;
          }

          //$('.ctct-form-button').prop('disabled',true);
      });

      // Handle skin-type changes.
      $( '#input_skintype' ).change( function() {
          $( '#custom_field_string_skin_type_0' ).prop( 'value', $( this ).prop( 'value' ) );
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
          '#first_name_0',
          '#last_name_0',
          '#email_address_0'
        ], function( id ) {
          $( id ).removeClass( 'is-error' );
          if ( $( id ).val() === '' ) {
            $( id ).addClass( 'is-error' );
            valid = false;
          }
        });

        // User Type
        $( '.input_usertype' ).removeClass( 'is-error' );
        if ( $( '#custom_field_string_user_type_0' ).val() === '' ) {
          $( '.input_usertype' ).addClass( 'is-error' );
          valid = false;
        }

        // Date
        $( '.input_age' ).removeClass( 'is-error' );
        if ( $( '#custom_field_string_user_type_0' ).val() === 'Consumer' && !checkDate() ) {
          $( '.input_age' ).addClass( 'is-error' );
          valid = false;
        }

        // Skin Type
        $( '.input_skintype' ).removeClass( 'is-error' );
        if ( $( '#custom_field_string_user_type_0' ).val() === 'Consumer' && $( '#custom_field_string_skin_type_0' ).val() === '' ) {
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

  // Load the ConstantContact sign-up widget library.
  var script = document.createElement( 'script' );
  script.src = '//static.ctctcdn.com/js/signup-form-widget/current/signup-form-widget.min.js';

  $( script ).insertAfter( '#cc-universal' );
});
