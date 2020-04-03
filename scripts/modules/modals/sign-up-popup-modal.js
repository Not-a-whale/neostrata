define([
  'modules/jquery-mozu'
], function ($) {
  $(document).ready(function () {
    var payload = {
        email: '',
        firstName: '',
        lastName: ''
    };

    var formState = {
        modalClosed: false,
        setCookie: function() {
            $.cookie('modal', 'closed', {
                expires: 10,
                path: '/'
            });
        }
    };

    $("#signUpPopUp").modal('show');

    $('#modalClose').click(function () {
      $('#signUpPopUp').modal('hide');
      formState.setCookie();
    });

    $('#singUpPopUpDialog').click(function () {
      formState.setCookie();
    });

    $('#signUpLabel').click(function () {
        payload.email = $('#signUp').val();
        formState.setCookie();
    });
  });
});
