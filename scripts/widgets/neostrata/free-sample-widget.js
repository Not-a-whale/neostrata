define([
    'modules/jquery-mozu',
    "modules/free-samples/free-samples"], function($, FreeSamplesViewFactory) {
    $(document).ready(function() {
        //console.log('Setting freeSamples on window');
        window.freeSamplesView = FreeSamplesViewFactory.createFreeSamplesViews({
            $body: $('[data-mz-free-samples]')
        });
    });
});
