/**
 * Unidirectional dispatch-driven collection views, for your pleasure.
 */
define([
    'backbone',
    'modules/jquery-mozu',
    'underscore',
    'modules/url-dispatcher',
    'modules/intent-emitter',
    'modules/get-partial-view',
    'modules/color-swatches',
     'modules/block-ui',
     'modules/category/infinite-scroller',
     'modules/models-product',
     'modules/api',
     'hyprlive',
     'modules/models-customer',
     "modules/cart-monitor",
     "modules/metrics"
], function(Backbone, $ , _, UrlDispatcher, IntentEmitter, getPartialView,colorSwatch,blockUiLoader,InfiniteScroller, ProductModels, api, Hypr, CustomerModels, CartMonitor, MetricsEngine) {

    function factory(conf) {

        var _$body = conf.$body;
        var _dispatcher = UrlDispatcher;
        var _isColorClicked = false;
        var ROUTE_NOT_FOUND = 'ROUTE_NOT_FOUND';
        var _mainImage = '';
        var footerPagingClicked=false;
        // on page load get facet href and append facets
        var path = getFacet();
        if (path !== "") {
            updateFacetFilter(path);
        }
        function showError(error) {
            // if (error.message === ROUTE_NOT_FOUND) {
            //     window.location.href = url;
            // }
            _$body.find('[data-mz-messages]').text(error.message);
        }

         function intentToUrl(e) {
            if ($(".blockOverlay").length > 0) {
                return;
            }
            //show loading
            blockUiLoader.globalLoader();
            var path = getFacet();
            var elm = e.target;
            var url;
            var del_url;
            if (elm.tagName.toLowerCase() === "select") {
                elm = elm.options[elm.selectedIndex];
            }
            url = elm.getAttribute('data-mz-url') || elm.getAttribute('href') || '';
            if (url && url[0] != "/") {
                url = (url.substr(url.length - 3) === '%3a') ? url.substring(0, url.length - 3) : url;
                var parser = document.createElement('a');
                parser.href = url;
                url = window.location.pathname + parser.search;
            }
            return url;
        }
        //remove facets when clicked on cross
        $('#page-content').on('click', '.remove-facet', (function(e) {
            blockUiLoader.globalLoader();
            var mzFacet = $(this).attr('data-mz-facet');
            var mzFacetValue = $(this).attr('data-mz-facet-value');
            var delFacet = mzFacet + ':' + mzFacetValue.replace(/\s/g, '+');
            var delFacet1 = mzFacet + '%3a' + mzFacetValue.replace(/\s/g, '+');
            //remove facet from url
            var path = getFacet();
            path = decodeURIComponent(path);
            var url = path.replace(delFacet + ',', '');
            url = url.replace(delFacet1 + ',', '');
            url = url.indexOf(delFacet) >= 0 ? path.replace(delFacet, '') : url;
            url = url.indexOf(delFacet1) >= 0 ? path.replace(delFacet1, '') : url;
            url = (url === '?facetValueFilter=') ? window.location.pathname : url;
            url = (url.substr(url.length - 1) === ':') ? url.substring(0, url.length - 1) : url;

            var parser = document.createElement('a');
            parser.href = url;
            url = window.location.pathname + parser.search;
            if (url && _dispatcher.send(url)) {
                _$body.addClass('mz-loading');
                e.preventDefault();
            }
        }));

        var navigationIntents = IntentEmitter(
            _$body,
            [
                'click [data-mz-pagingcontrols] a',
                'click [data-mz-pagenumbers] a',
                'click a[data-mz-facet-value]',
                'click [data-mz-action="clearFacets"]',
                'change input[data-mz-facet-value]',
                'change [data-mz-value="pageSize"]',
                'change [data-mz-value="sortBy"]',
                'click .dp-sort-item'
            ],
            intentToUrl
        );

        var toggleView = IntentEmitter(
            _$body, [
                'click [data-btn-view-toggle]'
            ],
            toggleProductView
        );

        navigationIntents.on('data', function(url, e) {
            if (url && _dispatcher.send(url)) {
                _$body.addClass('mz-loading');
                e.preventDefault();
            }
        });


        //create facets and append them in list
        function updateFacetFilter(path) {

            if (path.indexOf("facetValueFilter") > -1) {
                var pathArray = path.substring(1).split("&");
                var facetValue = "";
                for (var i = 0; i < pathArray.length; i++) {
                    var currentElmnt = pathArray[i].split("=");
                    if (currentElmnt[0] === "facetValueFilter") {
                        facetValue = currentElmnt[1];
                        break;
                    }
                }
                if (facetValue !== "") {
                    facetValue = decodeURIComponent(facetValue).split(",");
                    var available_facets = "";
                    for (var j = 0; j < facetValue.length; j++) {
                        var facetKey = facetValue[j].split(":")[0];
                        var facetVal = facetValue[j] !== "" ? facetValue[j].split(":")[1].replace(/\+/g, ' ') : "";
                        if (facetVal === "") {
                            continue;
                        }
                        if (facetVal.indexOf("&#38") != facetVal.indexOf("&#38;")) {
                            facetVal = facetVal.replace(/\&#38/g, '&amp;');
                        }
                        var displayValue = facetVal;

                        if (facetKey === 'price') {
                            if (displayValue.indexOf("* TO")) {
                                displayValue = displayValue.replace("* TO ", "");
                                displayValue += " and under";
                            } else if (displayValue.indexOf("TO *")) {
                                displayValue = displayValue.replace(" TO *", "+");
                            }
                            displayValue = displayValue.replace("[", "$").replace("]", "").replace(/to/gi, "-");
                        }
                        var filterKeyFormat=facetKey.replace('~','-');
        
                        if(filterKeyFormat==='' && facetVal===''){
                            $('#filter-'+filterKeyFormat).find('.mz-clear-facet-section').addClass('hide');
                        }else{
                             $('#filter-'+filterKeyFormat).find('.mz-clear-facet-section').removeClass('hide');
                        }
                        //if(facetKey === 'tenant~size'){
                             displayValue=$('#'+facetVal).attr('data-mz-text-value');
                        //}
                        available_facets += '<li><i class="fa fa-times-circle remove-facet" data-mz-facet="' + facetKey + '" data-mz-facet-value="' + facetValue[j].split(":")[1] + '" data-mz-purpose="remove" data-mz-action="clearFacet"></i> <u>' + displayValue + '</u></li>';
                    }
                    if (available_facets !== '') {
                        var filterOptionList = $("#filterOptionList");
                        filterOptionList.append(available_facets);
                    }
                    return true;
                }
            }
        }
        //get facets from the href
        function getFacet() {
            var path = window.location.search;
            return path;
        }
         function updateUi(response) {
            var url = response.canonicalUrl;
            if (url && url.substr(url.length - 2) === '&&')
                url = url.substring(0, url.length - 1);
            _$body.html(response.body);
            if (url) _dispatcher.replace(url);
            _$body.removeClass('mz-loading');
            InfiniteScroller.update();
            if(footerPagingClicked){
                 $("html, body").animate({ scrollTop: 0 }, "1000");
                 footerPagingClicked=false;
            }
            //add facet filter to list if any
            var path = getFacet();
            updateFacetFilter(path);
            //check default view
            if ($.cookie("currentView") === "listView") {
                $("#listView").trigger("click");
            } else {
                $("#gridView").trigger("click");
            }
            blockUiLoader.unblockUi();
        }
         //Toggle View GRID/LIST
        function toggleProductView(_e) {
            var _self = $(_e.currentTarget);
            var toggleButtons = $("button[data-btn-view-toggle]");
            var toggleListView = $(".ml-list-view-toggle");
            //check if already active
            if (_self.hasClass("active")) {
                return;
            } else {
                //check which view is enable
                if (_self.attr("id") == "gridView" && !toggleListView.hasClass("grid-view")) {
                    toggleListView.addClass("grid-view").removeClass("list-view");
                    $.cookie("currentView", "gridView");
                } else {
                    toggleListView.addClass("list-view").removeClass("grid-view");
                    $.cookie("currentView", "listView");
                }
            }
            //make selected view icon active
            toggleButtons.removeClass("active");
            _self.addClass("active");
        }
        /*directory Add-To-Cart action */
        var directoryAddToCart = IntentEmitter(_$body,
                                               ['click #product-list-ul .mz-productdetail-addtocart',
                                                'click #more-list-ul .mz-productdetail-addtocart'],
                                               directoryAddToCartAction);
        function directoryAddToCartAction(_e){
            var productCode = $(_e.currentTarget).data("mz-product-code");
            if(productCode && productCode !== ''){
                api.get('product', productCode).then(function(productResponse){
                    var product = new ProductModels.Product(productResponse.data);
                    product.on('addedtocart', function(cartitem) {
                        if (cartitem && cartitem.prop('id')) {

                            //product.isLoading(true);
                            CartMonitor.addToCount( product.get('quantity'), true);
                            MetricsEngine.trackDirectoryAddToCart(product, product.get('categories')[0], false, 1);
                            $('html,body').animate({
                                scrollTop: $('header').offset().top
                            }, 1000);
                        } else {
                            product.trigger("error", { message: Hypr.getLabel('unexpectedError') });
                        }
                    });
                    product.addToCart();
                    //return location.reload();
                });
            }
        }
        /*directory Add-To-Cart action */
        /*directory Add-To-Wishlist action */
        var directoryAddToWishlist = IntentEmitter(_$body,
                                                   ['click #product-list-ul .mz-productdetail-addtowishlist',
                                                    'click #more-list-ul .mz-productdetail-addtowishlist'],
                                                    directoryAddToWishlistAction);
        function directoryAddToWishlistAction(_e){
            var productCode = $(_e.currentTarget).data("mz-product-code");
            if(productCode && productCode !== ''){
                var user = require.mozuData('user');
                if(user.accountId){
                    var action = $(_e.currentTarget).data("mz-action");
                    if(action == 'directoryAddToWishlist'){
                        api.get('product', productCode).then(function(productResponse){
                            var product = new ProductModels.Product(productResponse.data);
                            product.addToWishlist();
                            $('#wishlist-'+productCode).attr("data-mz-action", "directoryRemoveFromWishlist");
                            if($('#addToWishListPopUp').length === 1){
                                $('#addToWishListPopUp').remove();
                            }
                            $( '<div id="addToWishListPopUp" class="row alert" role="alert"><div class="col-xs-6 text-right">Item added to wishlist.</div><div class="col-xs-6 text-left"><a href="/myaccount#wishlist">View Wishlist</a></div></div>' ).insertAfter('#nav-header-container > #ml-nav');
                            setTimeout(function(){
                                $('#addToWishListPopUp').fadeOut(function(){$(this).remove();});
                            }, 5000);
                            return $('#wishlist-'+productCode+' span').removeClass("blank-heart").addClass("filled-heart");
                        });
                    }else if(action == 'directoryRemoveFromWishlist'){
                        var finishRemoveItemId = $(_e.currentTarget).data('mz-item-id');
                        var wishlistId = $(_e.currentTarget).data('mz-wishlist-id');
                        var serviceurl = '/api/commerce/wishlists/'+ wishlistId +'/items/' + finishRemoveItemId;
                        api.request('DELETE', serviceurl).then(function(res) {
                            $('#wishlist-'+productCode).attr("data-mz-action", "directoryAddToWishlist");
                            if($('#addToWishListPopUp').length === 1){
                                $('#addToWishListPopUp').remove();
                            }
                            $( '<div id="addToWishListPopUp" class="row alert" role="alert"><div class="col-xs-6 text-right">Item removed from wishlist.</div><div class="col-xs-6 text-left"><a href="/myaccount#wishlist">View Wishlist</a></div></div>' ).insertAfter('#nav-header-container > #ml-nav');
                            setTimeout(function(){
                                $('#addToWishListPopUp').fadeOut(function(){$(this).remove();});
                            }, 5000);
                            return $('#wishlist-'+productCode+' span').removeClass("filled-heart").addClass("blank-heart");
                        });
                    }
                }else{
                    sessionStorage.setItem('addToWishlist', productCode);
                    $(".login-link-text").trigger("click");
                }
            }
        }
        /*directory Add-To-Wishlist action */
        /*directory Email-Me action */
        var directoryEmailMe = IntentEmitter(_$body,
                                                   ['click #product-list-ul .mz-productdetail-emailme',
                                                    'click #more-list-ul .mz-productdetail-emailme'],
                                                    directoryEmailMeAction);
        function directoryEmailMeAction(_e){
            blockUiLoader.globalLoader();
            var productCode = $(_e.currentTarget).data("mz-product-code");
            var locationCode = $(_e.currentTarget).data("mz-location-code");
            var user = require.mozuData('user');
            if(productCode && productCode !== '' && user){
                api.get('product', productCode).then(function(productResponse){
                    var product = new ProductModels.Product(productResponse.data);
                    api.create('instockrequest', {
                        email: user.email,
                        customerId: user.accountId,
                        productCode: productCode,
                        locationCode: product.get('inventoryInfo').onlineLocationCode
                    }).then(function () {
                        console.log(product);
                        //self.render();
                    }, function (res) {
                        console.log(res.message);
                        console.log(Hypr.getLabel('notifyWidgetError'));
                    });
                });
            }
            blockUiLoader.unblockUi();
        }
        /*directory Email-Me action */
         //Select color Swatch
        var selectSwatch = IntentEmitter(
            _$body, [
                'click #product-list-ul [data-mz-swatch-color]',
                'click #more-product-list [data-mz-swatch-color]',
                'mouseenter #product-list-ul [data-mz-swatch-color]',
                'mouseleave #product-list-ul [data-mz-swatch-color]'
            ],
            changeColorSwatch
        );
        //Change color swatch
        function changeColorSwatch(_e) {
            if(_e.type == 'mouseenter'){
                colorSwatch.onMouseEnter(_e);
            }
            else if(_e.type == 'mouseleave'){
                colorSwatch.onMouseLeave(_e);
            }
            else{
                _isColorClicked = true;
                colorSwatch.changeColorSwatch(_e);
                _isColorClicked = false;
            }
        }
        _dispatcher.onChange(function(url) {
            getPartialView(url, conf.template).then(updateUi, showError);
        });
        //Show more swatches
        var showMoreSwatch = IntentEmitter(
            _$body, [
                'click .showMoreSwatches'
            ],
            showMoreColors
        );
        //show all colors
        function showMoreColors(_e) {
            var _self = $(_e.currentTarget);
            var currentProduct = _self.parents(".ml-product-swatch");
            _self.parent("li").hide();
            currentProduct.find("li.mz-hide-color").removeClass("mz-hide-color");
        }
        //toggle filters
        var toggleFilters = IntentEmitter(
            _$body, [
                'click [data-mz-filters-collapse]'
            ],
            toggleFiltersView
        );
        var divHeight;
        function clearAllHeight() {
            divHeight = $('.mz-filter-mobile').height();
            if(divHeight===0){
                $(".mz-clear-btn-mobile").css('top','1px');
            }else{
                $(".mz-clear-btn-mobile").css('top',divHeight);
            }
        }
        $(document).on("click", ".mz-utilitynav-link", function(e){
            $('#sort-tab').removeClass('active');
            $('#filter-tab').removeClass('active');
            $("#sort-tab-li").removeClass('active');
            $("#filter-tab-li").removeClass('active');
        });
        $(document).on("click", "#filter-tab-li", function(e){
            $('#ml-nav').removeClass('in');
            if($(this).hasClass('active')){
                $(this).removeClass('active');
                $("#filter-tab").removeClass('active');

            }else{
                if($("#sort-tab-li").hasClass('active')){
                    $("#sort-tab-li").removeClass('active');
                    $("#sort-tab").removeClass('active');
                    $(".mz-clear-btn-mobile").css('opacity','0.95');
                }
                $(this).addClass('active');
                $("#filter-tab").addClass('active');
            }
            clearAllHeight();
        });
        $(document).on("click", ".mz-filter-mobile",function(){
            clearAllHeight();
        });
        $(document).on("click", "#sort-tab-li", function(e){
            $('#ml-nav').removeClass('in');
            if($(this).hasClass('active')){
                $(this).removeClass('active');
                $("#sort-tab").removeClass('active');
                clearAllHeight();
                $(".mz-clear-btn-mobile").css('opacity','0.95');
            }else{
                if($("#filter-tab-li").hasClass('active')){
                    $("#filter-tab-li").removeClass('active');
                    $("#filter-tab").removeClass('active');
                    $(".mz-clear-btn-mobile").css('opacity','0');
                }
                $(this).addClass('active');
                $("#sort-tab").addClass('active');
            }
        });

        var footerPaging=IntentEmitter(
            _$body, [
                'click .mz-l-paginatedlist-footer a'
            ],
            footerPagingRender
        );
        function footerPagingRender(){
           footerPagingClicked=true;
        }

        var clearFacet=IntentEmitter(
            _$body, [
                'click .mz-clear-facet-section'
            ],
            clearFacetSection
        );

        function clearFacetSection(_e){
            blockUiLoader.globalLoader();
            var _self = $(_e.currentTarget);
            var facetVal = _self.attr("data-clear-text");
            var path = getFacet();
            path = decodeURIComponent(path);
            var url= path.replace(new RegExp(facetVal+'\:(.*?)(,|&)', 'g'), '');
            if(url[url.length -1]==','){
                url = url.replace(new RegExp(',$', 'g'), '\&');

            }
            var parser = document.createElement('a');
            parser.href = url;
            url = window.location.pathname + parser.search;
            if (url && _dispatcher.send(url)) {
                _$body.addClass('mz-loading');
                _e.preventDefault();
            }
        }
        //Toggle filters
        function toggleFiltersView(_e) {
            var icon = $('#collapseIcon>i');
            var elmtn = $('#filterOptions');
            $(elmtn).toggle();

            if ($(icon).hasClass("fa-plus")) {
                $(icon).removeClass("fa-plus").addClass("fa-minus");
            } else {
                $(icon).addClass("fa-plus").removeClass("fa-minus");
            }
        }
        //toggle filter
        var toggleFilter = IntentEmitter(
            _$body, [
                'click [data-mz-filter-collapse]'
            ],
            toggleFilterView
        );
        //Toggle filter
        function toggleFilterView(_e) {
            var _self = $(_e.currentTarget);
            var count = _self.attr("data-mz-filter-collapse");
            var icon = $('#filterIcon' + count);
            var elmtn = $('#filterList' + count);

            if($(elmtn).hasClass("active")){
                $(elmtn).removeClass("active");
                $(".mz-l-sidebaritem").removeClass("active-filter");
                $(icon).find("i.fa")
                    .removeClass("fa-minus")
                    .addClass("fa-plus");
            }else{
                $(".second-tab").removeClass("active");
                $("#sort-tab").removeClass("active");
                $(".mz-facetingform-facet").removeClass("active");
                $(".mz-l-sidebaritem").removeClass("active-filter");
                $(elmtn).addClass("active");
                $(elmtn).parent().addClass("active-filter");
                $(".filter-icon").find("i.fa")
                    .removeClass("fa-minus")
                    .addClass("fa-plus");

                $(icon).find("i.fa")
                    .removeClass("fa-plus")
                    .addClass("fa-minus");
            }
        }
        //toggle filter
        var backToTop = IntentEmitter(
            _$body, [
                "click .back-to-top"
            ],
            backToTopFn
        );
        function backToTopFn() {
            $("html, body").animate({ scrollTop: 0 }, 500);
        }
        //Switch More
        var switchMore = IntentEmitter(
            _$body, [
                "click .show-more"
            ],
            switchMoreFn
        );
        function switchMoreFn(e) {
            var parentLi = $(e.currentTarget).parent("li.show-more-li");
            if (parentLi.hasClass("show-less")) {
                parentLi.find("a").text("More...");
                parentLi.removeClass("show-less").parent("ul").find("li.mz-hide-text").addClass("hide");
            } else {
                parentLi.find("a").text("Less...");
                parentLi.addClass("show-less").parent("ul").find("li.mz-hide-text").removeClass("hide");
            }
        }
        if ($(".view-all.selected").length) {
            InfiniteScroller.update();
        }
    }

    $(document).ready(function() {
        $('[data-toggle-product-list="tooltip"]').tooltip({
            trigger: 'click'
        });
        var user = require.mozuData('user');
        if(user.accountId){
            var addToWishlist = sessionStorage.getItem('addToWishlist');
            if(addToWishlist){
                sessionStorage.removeItem('addToWishlist');
                sessionStorage.clear();
                api.get('product', addToWishlist).then(function(productResponse){
                    var product = new ProductModels.Product(productResponse.data);
                    product.addToWishlist();
                    if($('#addToWishListPopUp').length === 1){
                        $('#addToWishListPopUp').remove();
                    }
                    $( '<div id="addToWishListPopUp" class="row alert" role="alert"><div class="col-xs-6 text-right">Item added to wishlist.</div><div class="col-xs-6 text-left"><a href="/myaccount#wishlist">View Wishlist</a></div></div>' ).insertAfter('#nav-header-container > #ml-nav');
                    setTimeout(function(){
                        $('#addToWishListPopUp').fadeOut(function(){$(this).remove();});
                    }, 5000);
                    $('#wishlist-'+addToWishlist).attr("data-mz-action", "directoryRemoveFromWishlist");
                    $('#wishlist-'+addToWishlist+' span').removeClass("blank-heart").addClass("filled-heart");
                });
            }
            api.createSync('wishlist').getOrCreate(user.accountId).then(function(wishlist) {
                return wishlist.data;
            }).then(function(wishlistItems) {
                var wishlistId = wishlistItems.id;
                for (var i = 0; i < wishlistItems.items.length; i++) {
                    var divId = '#wishlist-'+wishlistItems.items[i].product.productCode;
                    if($(divId)){
                        $(divId).attr("data-mz-wishlist-id", wishlistId);
                        $(divId).attr("data-mz-item-id", wishlistItems.items[i].id);
                        $(divId).attr("data-mz-action", "directoryRemoveFromWishlist");
                        $(divId+' span').removeClass("blank-heart").addClass("filled-heart");
                    }
                }
            });
        }

        $('body').click(function(e){
            var self = $(this);
            if(e.target.attributes['data-toggle-product-list']===undefined){
                if(self.find('.tooltip.in').length>0 && self.find('.tooltip.in').prev().attr('data-toggle-product-list')==="tooltip"){
                    self.find('.tooltip.in').prev().trigger('click');
                }
            }
            var $target = $('.mz-l-sidebaritem');
            if($target !== e.target && !$target.has(e.target).length){
                $(".mz-l-sidebaritem").removeClass("active-filter");
                $(".mz-facetingform-facet").removeClass("active");
                $('.filter-icon').find("i.fa")
                    .removeClass("fa-minus")
                    .addClass("fa-plus");
            }
            var $sortTarget = $('#sort-facet-tab');
            if($sortTarget !== e.target && !$sortTarget.has(e.target).length){
                if(window.innerWidth >= 992){
                    $(".second-tab").removeClass("active");
                    $("#sort-tab").removeClass("active");
                }
            }
        });
    });

    return {
        createFacetedCollectionViews: factory
    };

});
