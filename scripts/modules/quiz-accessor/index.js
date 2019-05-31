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
          //$.cookie('quiz-info','{"accountId":1136,"customerPreferences": {"quiz-skincare-knowledge":"intermediate", "quiz-recommended-regimen":"ALGO"}}');
        $.cookie('quiz-info','');
          var quizInfo = ($.cookie('quiz-info'))? JSON.parse($.cookie('quiz-info')) : {};
          if (quizInfo && quizInfo.customerPreferences && quizInfo.customerPreferences['quiz-recommended-regimen']){
            console.log('quiz completed');
            return true;
          }else{
            console.log('quiz NOT completed');
            return false;
          }
          
        }

});

  $(document).ready(function(){
      var quizModel = new QuizAccessorModel();
      var quizAccessorView = new QuizAccessorView({
          el: $('#quiz-accessor-container'),
          model: quizModel
      });
      try {
        quizAccessorView.render();
      }
      catch(e){
        console.log(e);
      }
     

    });
});