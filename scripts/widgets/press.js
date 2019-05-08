require(["modules/jquery-mozu", "hyprlive", "modules/backbone-mozu", "modules/api"], function($, Hypr, Backbone, api) {
    var PressView = Backbone.MozuView.extend({
        templateName: 'modules/common/press-render',
        initialize : function(){
            var self = this;
            var pageSize = 2;
            var startFrom = self.model.attributes.initPage || 0;
            var currentPage = self.model.attributes.currentPage || 0;
            var endWith = pageSize - 1;

            var endHtml = document.createElement('div');

            var entitiesUrl = '/api/platform/entitylists/press@neost/entities?pageSize='+pageSize+'&startIndex='+startFrom+'&sortBy=id desc';

            $.ajax({
                url: entitiesUrl,
                success: function(resp) {
                    $('#press').removeClass('loading');
                    var totalItemsCount = resp.totalCount;
                    if (resp.totalCount > 0) {
                        console.log('resp', resp);
                        resp.items.forEach(function(el, idx) {
                            var element = self.$('.template').clone()[0];
                            $(element).removeClass('template');
                            $(element).addClass('press-element');
                            $(element).find('.title').html(el.title);
                            $(element).find('.subtitle').html(el.subtitle);
                            var splittedLocationAndDate = el.locationAndDate.split('–');
                            console.log('splittedLocationAndDate', splittedLocationAndDate);
                            if (splittedLocationAndDate.length > 1) {
                                $(element).find('.location-and-date').html('<i>'+splittedLocationAndDate[0]+'</i> – '+splittedLocationAndDate[1]);
                            } else {
                                splittedLocationAndDate = el.locationAndDate.split('-');
                                if (splittedLocationAndDate.length > 1) {
                                    $(element).find('.location-and-date').html('<i>'+splittedLocationAndDate[0]+'</i> – '+splittedLocationAndDate[1]);
                                } else {
                                    $(element).find('.location-and-date').html(splittedLocationAndDate);
                                }
                            }
                            $(element).find('.detail-url a').attr('href', el.readMoreLink);
                            endHtml.append(element);
                        });
                    }
                    self.model.set(resp);
                    self.render();

                    var navigation = $('.navigation');
                    if (resp.pageCount > 1) {
                        navigation.empty();
                        var pageCount = resp.pageCount;
                        var paginationArray = Array.apply(null, {length: pageCount}).map(Number.call, Number);

                        var nextPage = currentPage + 1;
                        if (nextPage > pageCount) nextPage = pageCount;
                        var prevPage = currentPage - 1;
                        if (prevPage < 0) prevPage = 0;

                        navigation.append('<input id="page-size" hidden value="'+pageSize+'">');
                        navigation.append('<div class="navigation-element"><a class="page-0 img"><img src="/resources/images/first-page.png"></a></div>');
                        navigation.append('<div class="navigation-element"><a class="page-'+prevPage+' img">Prev</a></div>');
                        paginationArray.forEach(function(el, idx) {
                            navigation.append('<div class="navigation-element"><a class="page-'+el+'">'+parseInt(el+1)+'</a></div>');
                        });
                        navigation.append('<div class="navigation-element"><a class="page-'+nextPage+' img">Next</a></div>');
                        navigation.append('<div class="navigation-element"><a class="page-'+parseInt(pageCount-1)+' img"><img src="/resources/images/last-page.png"></a></div>');
                        $('.page-'+currentPage).addClass('active');
                    }

                    $('.press-container').html(endHtml);
                }
            });

            // window.view.render();
            // var reseller = [];
            // var b2bid = customer.data.id;
            // var b2burl = '/api/commerce/customer/b2baccounts/'+b2bid+'/attributes';
        },
        render: function() {
            Backbone.MozuView.prototype.render.apply(this);
        }
    });

    $(document).ready(function(){
        var pressViewModel = Backbone.MozuModel.extend();
        var pressModel = new pressViewModel();
        var pressView = window.view = new PressView({
            el: $('#press'),
            model: pressModel
        });
        pressView.render(); 
        $('#render-test').on('click', function() {
            pressModel.set('initPage', 1);
            pressView.initialize();
        });
        $(document).on('click', '.navigation-element a', function() {
            var pageNumber = parseInt($(this).attr('class').replace('page-', ''));
            var pageSize = $('#page-size').val();
            var startFrom = pageNumber * pageSize;
            pressModel.set('initPage', startFrom);
            pressModel.set('currentPage', pageNumber);
            pressView.initialize();
            $('body,html').animate({
                scrollTop: 0
            }, 300);
        });
    });
});
