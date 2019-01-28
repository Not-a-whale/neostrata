define([
    'modules/jquery-mozu',
    "modules/free-samples/views-collections"], function($, CollectionViewFactory) {
    $(document).ready(function() {
        window.facetingViews = CollectionViewFactory.createFacetedCollectionViews({
            $body: $('[data-mz-free-samples]'),
            template: "category-interior"
        });
    });
});
