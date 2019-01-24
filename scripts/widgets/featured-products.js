define(['modules/jquery-mozu', "modules/api"],
    function ($, api) {
        $(document).ready(function() {
            window.productRegimenCollection = [];
            var totalPrice = 0;
            var count = 0;
            var cat = $('.regimenProducts').data('mzCategoryRegimen');
            if(cat){
                api.get("search", { filter: "categoryId eq " + cat }).then(function(productResponse){
                    count = productResponse.length;
                    for(var i=0; productResponse.length; i++){
                        window.productRegimenCollection.push(productResponse[i].data.productCode);
                        totalPrice = totalPrice + productResponse[i].data.price.price;
                    }
                });
                setTimeout(function() {
                    $('.countProd').html( count + ' PRODUCTS - $' + totalPrice.toFixed(2));
                }, 1000);
            }
        });
    });