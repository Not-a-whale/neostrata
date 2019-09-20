require(["modules/jquery-mozu", "hyprlive"],
    function ($, Hypr) {
        $(document).ready(function () {
            var formCounter = 0;
            // config if loaded from preload script on .hypr
            var mozuFullConfig = require.mozuData("config");
            var config = require.mozuData("config").config;
            var formId = config.customId || mozuFullConfig.definitionId;

            // body params
            var sourceEmail = config.email_from ? config.email_from : "system@deplabs.com",
                ccEmailAddresses = config.email_cc ? config.email_cc.split(',') : [],
                subjectdata = config.subject ? config.subject : "Empty subject",
                emailTemplate = config.form_email_template ? config.form_email_template : "Empty text",
                successMessage = config.form_success_message ? config.form_success_message : "Mail sent successfully",
                errorMessage = config.form_error_message ? config.form_error_message : "Error sending email",
                msgPopup = (config.msg_popup && config.msg_popup !== 'False') ? true : false,
                msgSelector = config.msg_selector ? config.msg_selector : '';
                replyTo = config.reply_to ? config.reply_to : '';

            // this will look for a `data-custom-attribute` as name and get #id 
            // element values and substitute to the form

            updateValues();

            function updateValues(formId) {
                // this will look for a `data-custom-attribute` as name and get #id 
                // element values and substitute to the form

                $('#' + formId + ' input[data-custom-attribute]').each(function (idx, el) {
                    var checkedElement = $('#' + el.name);
                    var foundValue = $('#' + el.name).val();
                    if (foundValue && foundValue !== '') {
                        el.value = foundValue;
                    } else {
                        // we go deeeeeper   
                        // this particular case - find second-level radio buttons
                        checkedElement.find('input[type=radio]').each(function () {
                            if ($(this).prop('checked')) {
                                el.value = $(this).val();
                            }
                        });
                        // TODO: think of more universal usage
                    }
                    // change name values on keyup/change
                    $('#' + el.name).bind('keyup change', function () {
                        el.value = $('#' + el.name).val();
                    });
                });
            }

            $('.close').on('click', function () {
                $('.popup-overlay').fadeOut(200);
            });
            $('body').on('click', function () {
                $('.popup-overlay').fadeOut(200);
            });

            function sendEmail(formId) {
                if (formCounter <= 1) {

                    if (formId) {
                        if ($('#' + formId).attr('data-sourceEmail') !== '') sourceEmail = $('#' + formId).attr('data-sourceEmail');
                        ccEmailAddresses = $('#' + formId).attr('data-ccEmailAddresses').split(',');
                        if ($('#' + formId).attr('data-ccEmailAddresses') === "") {
                            ccEmailAddresses = [];
                        }
                        replyTo = $('#' + formId).attr('data-replyTo').split(',');
                        if ($('#' + formId).attr('data-replyTo') === "") {
                            replyTo = [];
                        }
                        if ($('#' + formId).attr('data-subjectdata') !== '') subjectdata = $('#' + formId).attr('data-subjectdata');
                        if ($('#' + formId).attr('data-emailTemplate') !== '') emailTemplate = $('#' + formId).attr('data-emailTemplate');
                        if ($('#' + formId).attr('data-successMessage') !== '') successMessage = $('#' + formId).attr('data-successMessage');
                        if ($('#' + formId).attr('data-errorMessage') !== '') errorMessage = $('#' + formId).attr('data-errorMessage');
                        if ($('#' + formId).attr('data-msgPopup') !== 'False') msgPopup = true;
                        if ($('#' + formId).attr('data-msgSelector') !== '') msgSelector = $('#' + formId).attr('data-msgSelector');
                    }
                    updateValues(formId);
                    var replacedTemplate = emailTemplate;
                    var replaceSubject = subjectdata;
                    if (!formId || formId === null) formId = mozuFullConfig.definitionId;
                    var formSerialize = $('#' + formId).serialize(),
                        toEmailAddresses = new Array($('#' + formId + ' input[name="form-email"]').val()),
                        formArray = $('#' + formId).serializeArray();

                    // recoursively replace {%value%} with needed values
                    formArray.forEach(function (el, idx) {
                        var field = el.name;
                        var value = el.value;
                        if (value && value !== '') {
                            var regex = new RegExp("{" + field + "}", "gi");
                            replacedTemplate = replacedTemplate.replace(regex, value);
                            replaceSubject = replaceSubject.replace(regex, value);
                        }
                    });

                    // form the data body
                    var body = {
                        "bccEmailAddresses": [],
                        "ccEmailAddresses": ccEmailAddresses,
                        "toEmailAddresses": toEmailAddresses,
                        "bodyData": replacedTemplate ? replacedTemplate : emailTemplate,
                        "bodyCharset": "UTF-8",
                        "subjectdata": replaceSubject ? replaceSubject : subjectdata,
                        "subjectCharset": "UTF-8",
                        "sourceEmail": sourceEmail,
                        "replyToAddresses": replyTo
                    };

                    $.ajax({
                        url: '/email', // TODO: transfer to ARC
                        method: 'POST',
                        headers: {
                            "Content-Type": "application/json", // welp, that was the game changer in this request
                            "data": JSON.stringify(body),
                            "successMessage": successMessage,
                            "errorMessage": errorMessage
                        }
                    })
                    .success(function (response) {

                        var message = response.message;
                        $('#' + formId + ' .response-message').remove();
                        if (response.statusCode == 200) {
                            // console.log(msgSelector, msgPopup);
                            if(msgPopup && msgPopup !== 'False') {
                                $('.email-message').html(message);
                                $('.popup-overlay').fadeIn(200);
                            } else {
                                $(msgSelector).html(message);
                                // $('#' + formId).append('<span class="response-message success">' + message + '</span>');
                            }
                        } else {
                            if(msgPopup && msgPopup !== 'False') {
                                $('.email-message').html(message);
                                $('.popup-overlay').fadeIn(200);
                            } else {
                                $(msgSelector).html(message);
                                // $('#' + formId).append('<span class="response-message error">' + message + '</span>');
                            }
                        }
                    });
                }
            }
            $('input[name = "submit-email-form"]').on('click', function (e) {
                if (formCounter <= 1) {
                    formCounter++;
                    var customId = $(this).closest('form').attr('id');
                    // console.log('customId', customId);
                    // console.log($('#' + customId).find('input[required]:visible').val());
                    var isFilled = false;
                    $('#' + customId).find('input[required]:visible').each(function() {
                        // console.log($(this).val());
                        if ($(this).val() || $(this).val() !== '') {
                            isFilled = true;
                        } else {
                            isFilled = false;
                        }
                    });
                    // console.log(isFilled);
                    if (isFilled && customId === 'contact-us') {
                        e.preventDefault();
                        sendEmail(customId);
                    } else if (customId === 'account-request') {
                        e.preventDefault();
                        sendEmail(customId);
                    } else if (!isFilled && customId === 'contact-us') {
                        formCounter = 0;
                        return;
                    }

                } else {
                    e.preventDefault();
                    return;
                }
            });
        });
    });