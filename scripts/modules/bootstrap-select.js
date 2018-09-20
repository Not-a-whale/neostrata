define(['modules/jquery-mozu', 'shim!vendor/bootstrap-select/dist/js/bootstrap-select[jquery=jquery]>jquery' ],
  function ($) {
    $(document).ready(function() {
      $('.selectpicker').selectpicker();
    });
  }
);
