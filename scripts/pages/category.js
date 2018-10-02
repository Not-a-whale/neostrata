define([
    'modules/jquery-mozu',
    "modules/views-collections",
    "elevatezoom"], function($, CollectionViewFactory, elevatezoom) {
    $(document).ready(function() {
        $('.mz-productlisting-image img').elevateZoom({ zoomType: "inner", cursor: "crosshair" });
        window.facetingViews = CollectionViewFactory.createFacetedCollectionViews({
            $body: $('[data-mz-category]'),
            template: "category-interior"
        });
    });
});