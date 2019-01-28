define(['shim!vendor/typeahead.js/typeahead.bundle[modules/jquery-mozu=jQuery]>jQuery', 'hyprlive', 'modules/api',
      'hyprlivecontext'], function($, Hypr, api,
        HyprLiveContext) {

    // bundled typeahead saves a lot of space but exports bloodhound to the root object, let's lose it
    var Bloodhound = window.Bloodhound.noConflict();

    // bloodhound wants to make its own AJAX requests, and since it's got such good caching and tokenizing algorithms, i'm happy to help it
    // so instead of using the SDK to place the request, we just use it to get the URL configs and the required API headers
    var qs = '%QUERY',
        eqs = encodeURIComponent(qs),
        suggestPriorSearchTerms = Hypr.getThemeSetting('suggestPriorSearchTerms'),
        getApiUrl = function(groups) {
            return api.getActionConfig('suggest', 'get', { query: qs, groups: groups }).url;
        },
        termsUrl = getApiUrl('terms'),
        productsUrl = getApiUrl('pages'),
        ajaxConfig = {
            headers: api.getRequestHeaders()
        },
        i,
        nonWordRe = /\W+/,
        makeSuggestionGroupFilter = function(name) {
            return function(res) {
                var suggestionGroups = res.suggestionGroups,
                    thisGroup;
                for (i = suggestionGroups.length - 1; i >= 0; i--) {
                    if (suggestionGroups[i].name === name) {
                        thisGroup = suggestionGroups[i];
                        break;
                    }
                }
                return thisGroup.suggestions;
            };
        },

        makeTemplateFn = function(name) {
            var tpt = Hypr.getTemplate(name);
            return function(obj) {
                return tpt.render(obj);
            };
        },

    // create bloodhound instances for each type of suggestion

    AutocompleteManager = {
        datasets: {
            pages: new Bloodhound({
                datumTokenizer: function(datum) {
                    return datum.suggestion.term.split(nonWordRe);
                },
                queryTokenizer: Bloodhound.tokenizers.whitespace,
                remote: {
                    url: productsUrl,
                    wildcard: eqs,
                    filter: makeSuggestionGroupFilter("Pages"),
                    rateLimitWait: 400,
                    ajax: ajaxConfig
                }
            })
        }
    };

    $.each(AutocompleteManager.datasets, function(name, set) {
        set.initialize();
    });

    var dataSetConfigs = [
        {
            name: 'pages',
            displayKey: function(datum) {
                return datum.suggestion.productCode;
            },
            templates: {
                suggestion: makeTemplateFn('modules/search/autocomplete-page-result')
            },
            source: AutocompleteManager.datasets.pages.ttAdapter()
        }
    ];

    if (suggestPriorSearchTerms) {
        AutocompleteManager.datasets.terms = new Bloodhound({
            datumTokenizer: function(datum) {
                return datum.suggestion.term.split(nonWordRe);
            },
            queryTokenizer: Bloodhound.tokenizers.whitespace,
            remote: {
                url: termsUrl,
                wildcard: eqs,
                filter: makeSuggestionGroupFilter("Terms"),
                rateLimitWait: 100,
                ajax: ajaxConfig
            }
        });
        AutocompleteManager.datasets.terms.initialize();
        dataSetConfigs.push({
            name: 'terms',
            displayKey: function(datum) {
                return datum.suggestion.term;
            },
            source: AutocompleteManager.datasets.terms.ttAdapter()
        });
    }

    $(document).ready(function() {
        function hideSearch(){
            $('.search-background').animate( {'opacity':'0'}, {duration:300, done: function(){
                $('.search-background').hide();
            }});
            $('#searchbox').animate( {top:'-9rem'}, {duration:300, easing: 'linear', done: function(){
                $('#searchbox').addClass('hidden-search');
            }});
        }

        var $field = AutocompleteManager.$typeaheadField = $('[data-mz-role="searchquery"]');
        AutocompleteManager.typeaheadInstance = $field.typeahead({
            minLength: 1
        }, dataSetConfigs).data('ttTypeahead');
        // user hits enter key while menu item is selected;
        $field.on('typeahead:selected', function (e, data, set) {
            if (data.suggestion.productCode) window.location = (HyprLiveContext.locals.siteContext.siteSubdirectory||'') + "/p/" + data.suggestion.productCode;
        });
        $('#searchbox').on('submit', function(e){
            var searchVal = $('#search-field').val().trim();
            if(searchVal === ""){
                alert(Hypr.getLabel('blankSearchResult'));
                e.preventDefault();
            }else if(searchVal.length < 3){
                alert(Hypr.getLabel('searchLessCharacters'));
                e.preventDefault();
            }
        });
        $('.ml-header-search-wrapper .search-button').click(function(){
			if($('#searchbox').hasClass('hidden-search')){
                $('#searchbox').removeClass('hidden-search');
                $('#searchbox').animate( {top:'0'}, 300 );
                $('.search-background').show();
                $('.search-background').animate( {'opacity':'1'}, 300 );
                $('#search-field').focus();
            }
            else{
				hideSearch();
            }
            return false;
        });
        $('#searchbox .close-search-button').click(function(){
            hideSearch();
        });

        $(document).click(function(event) {
            if(!$(event.target).closest('#searchbox').length) {
                if(!$('#searchbox').hasClass('hidden-search')) {
					hideSearch();
                }
            }
        });

		$(window).scroll(function() {
			var $nav_header_container = $('#nav-header-container');
			var $page_content = $('#page-content');
			if ( window.pageYOffset > 38 ) {
				$nav_header_container.addClass( "sticky-nav" );
                $page_content.addClass( "sticky-nav-present" );
			} else {
				$nav_header_container.removeClass( "sticky-nav" );
                $page_content.removeClass( "sticky-nav-present" );
			}
		});
    });

    return AutocompleteManager;
});
