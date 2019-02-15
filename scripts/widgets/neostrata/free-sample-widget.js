define([
    'modules/jquery-mozu',
    "modules/free-samples/free-samples"], function($, FreeSamplesView) {
    $(document).ready(function() {
        //console.log('Setting freeSamples on window');
        window.freeSamplesView = new FreeSamplesView( {
          el: '#free-samples',
          categoryId: $('#free-samples').data('mz-free-samples')
        });
    });
});
