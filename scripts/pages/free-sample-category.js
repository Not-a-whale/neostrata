define([
    'modules/jquery-mozu',
    "modules/views-collections-free-sample"], function($, CollectionViewFactory) {
    $(document).ready(function() {
        window.facetingViews = CollectionViewFactory.createFacetedCollectionViews({
            $body: $('[data-mz-category]'),
            template: "category-interior"
        });
    });
});