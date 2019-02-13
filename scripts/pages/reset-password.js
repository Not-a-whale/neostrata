define([
    'modules/jquery-mozu',
    'hyprlive'], function($, Hypr) {
        
    $(document).ready(function() {

        $("#password-submit").attr('disabled', false);
        $("#mz-loginform-page").submit(function(e){

            $('.mz-messagebar').html();    
            
            var newPass = $("#newpassword").val();
            if(!newPass) return parseError(e, Hypr.getLabel('passwordMissing'));    

            var count = 0,
            minMaxLength = /^[\s\S]{6,50}$/,
            upper = /[A-Z]/,
            lower = /[a-z]/,
            number = /[0-9]/,
            special = /[^A-Za-z0-9]/;

            if (newPass !== $("#passwordconfirm").val()) return parseError(e, Hypr.getLabel('passwordsDoNotMatch'));
            
            if (!minMaxLength.test(newPass)) return parseError(e, Hypr.getLabel('passwordlength'));
            
            if (upper.test(newPass)) count++;
            if (lower.test(newPass)) count++;
            if (number.test(newPass)) count++;
            if (special.test(newPass)) count++;

            if(count < 3) return parseError(e, Hypr.getLabel('passwordStrong'));

            return true;                    
        });
    });
    
    function parseError(e, errorMsg){
        
        $('.mz-messagebar').html('<ul class="is-showing mz-errors"><li class="mz-message-item">'+errorMsg+'</li></ul>');
        e.preventDefault();
        return false;        
    }
});