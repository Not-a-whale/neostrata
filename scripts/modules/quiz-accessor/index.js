define(['modules/api',
'modules/backbone-mozu',
'underscore',
'modules/jquery-mozu'],
function (api, Backbone, _, $){
    
  var QuizAccessorView = Backbone.MozuView.extend({
    templateName: 'Widgets/misc/quiz-accessor-widget',
   
  
    render: function() {
      Backbone.MozuView.prototype.render.apply(this);
    }
  });

  var QuizAccessorModel = Backbone.MozuModel.extend({
        mozuType: 'quizAccessor',
        helpers: ['isQuizTaken','userName'],
        userName: function(){
          var user = require.mozuData('user');
          var ret = '';
          if (user && user.firstName){
            ret+= ', '+user.firstName;
          }
          ret+='.';
          return ret;

        },       
        isQuizTaken: function(){
            
            if($.cookie('quiz-info')){
                var quizInfo = JSON.parse($.cookie('quiz-info'));    
                if (quizInfo['quiz-recommended-regimen']) return true;
            }
            
            return false;    
        }

});

  $(document).ready(function(){
      var quizModel = new QuizAccessorModel();
      var quizAccessorView = new QuizAccessorView({el: $('#quiz-accessor-container'),
                                                   model: quizModel});
      try {
        quizAccessorView.render();
        var user = require.mozuData('user');
        if(!$.cookie('quiz-info') && user.isAuthenticated && user.accountId){
            var apiData = require.mozuData('apicontext');                            
            $.ajax({
                url: '/api/commerce/customer/accounts/'+user.accountId+'/attributes',
                headers: apiData.headers,
                method: 'GET',
                success: function(data) {
                    if(data.totalCount){
                        var quizInfo = {};
                        var customerAttributes = data.items;
                        customerAttributes.forEach(function(attribute) {
                            var quizValue = attribute.values[0];
                            if(attribute.fullyQualifiedName == 'tenant~quiz-recommended-regimen') quizInfo['quiz-recommended-regimen'] = quizValue;
                            if(attribute.fullyQualifiedName == 'tenant~quiz-recommended-product') quizInfo['quiz-recommended-product'] = quizValue;
                            if(attribute.fullyQualifiedName == 'tenant~quiz-skincare-knowledge') quizInfo['quiz-skincare-knowledge'] = quizValue;
                            if(attribute.fullyQualifiedName == 'tenant~quiz-primary-skin-concern') quizInfo['quiz-primary-skin-concern'] = quizValue;
                            if(attribute.fullyQualifiedName == 'tenant~quiz-skin-type') quizInfo['quiz-skin-type'] = quizValue;
                            if(attribute.fullyQualifiedName == 'tenant~quiz-products-currently-used') quizInfo['quiz-products-currently-used'] = quizValue;
                            if(attribute.fullyQualifiedName == 'tenant~quiz-routine-product-number') quizInfo['quiz-routine-product-number'] = quizValue;
                            if(attribute.fullyQualifiedName == 'tenant~quiz-gender') quizInfo['quiz-gender'] = quizValue;
                            if(attribute.fullyQualifiedName == 'tenant~quiz-age') quizInfo['quiz-age'] = quizValue;
                        });
                        if(quizInfo){
                            $.cookie('quiz-info', JSON.stringify(quizInfo));
                            quizAccessorView.render();                    
                        }
                    }
                }
            }); 
        }
      }catch(e){
        console.log(e);
      }
    });
});